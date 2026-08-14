const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const MongoStore = require('connect-mongo').default;
const { csrfSync } = require('csrf-sync');
const Vaga = require('./models/Vaga');
const User = require('./models/User'); // Importe o modelo de usuário
const AplicadoVaga = require('./models/Aplicado-Vaga');
const Perguntas = require('./models/Perguntas');
const PerguntasUser = require('./models/Perguntas-User');
const passport = require('passport'); // Requer o Passport.js
const LocalStrategy = require('passport-local').Strategy; // Requer a estratégia Local
const session = require('express-session'); // Requer express-session
const flash = require('express-flash');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3000;

// Usa o Atlas quando MONGODB_URI estiver configurado e preserva o banco local
// para desenvolvimento sem um arquivo .env.
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost/EveryMind';
const sessionSecret = process.env.SESSION_SECRET || 'chave-apenas-para-desenvolvimento-local';

if (isProduction && !process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI deve ser configurada em producao.');
}

if (isProduction && !process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET deve ser configurado em producao.');
}

app.set('view engine', 'ejs');
app.disable('x-powered-by');
if (isProduction) app.set('trust proxy', 1);
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    strictTransportSecurity: isProduction ? undefined : false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'self'"],
            objectSrc: ["'none'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            fontSrc: ["'self'", 'data:', 'https:'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://vlibras.gov.br'],
            scriptSrcAttr: ["'unsafe-inline'"],
            frameSrc: ["'self'", 'data:', 'blob:'],
            connectSrc: ["'self'", 'https://vlibras.gov.br'],
            upgradeInsecureRequests: isProduction ? [] : null,
        },
    },
}));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false, limit: '100kb', parameterLimit: 50 }));

function checkAccess(tipo) {
    return (req, res, next) => {
        if (req.isAuthenticated() && req.user.tipo === tipo) {
            // O usuário tem acesso permitido, continue com a próxima rota ou middleware
            return next();
        } else {
            // O usuário não tem acesso permitido, redirecione para uma página de erro ou negue o acesso
            return res.redirect(ROUTE_LOGIN);
        }
    };
}

function checkAccessAny(...tipos) {
    return (req, res, next) => {
        if (req.isAuthenticated() && tipos.includes(req.user.tipo)) return next();
        return res.redirect(ROUTE_LOGIN);
    };
}

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    return res.redirect(ROUTE_LOGIN);
}

function canAccessCandidatura(req, candidatura) {
    if (req.user.tipo === 'everyMind') return true;
    if (req.user.tipo === 'tech') return candidatura.tech === req.user.nome;
    if (req.user.tipo === 'usuario') return candidatura.email === req.user.email;
    return false;
}

function canManageVaga(req, vaga) {
    return req.user.tipo === 'tech' && vaga.tech === req.user.nome;
}

function escapeRegex(value) {
    return String(value || '')
        .slice(0, 100)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Defina constantes para suas rotas
const ROUTE_HOME = '/';
const ROUTE_TODAS_VAGAS = '/todas-vagas';
const ROUTE_TODAS_VAGAS_DISPONIVEIS = '/todas-vagas-disponiveis';
const ROUTE_VAGAS = '/vagas/:id';
const ROUTE_INSERIR_VAGA = '/inserir-vaga';
const ROUTE_EXCLUIR_VAGA = '/excluir-vaga/:id';
const ROUTE_EDITAR_VAGA = '/editar-vaga/:id';
const ROUTE_EDITAR_STATUS_CANDIDATURA = '/editar-candidaturas/:id';
const ROUTE_PESQUISAR = '/pesquisar';
const ROUTE_LOGIN = '/login';
const ROUTE_LOGOUT = '/logout';
const ROUTE_USUARIO_LOGADO = '/usuario-logado';
const ROUTE_INSERIR_USUARIO = '/inserir-usuario';
const ROUTE_TECHRECRUITER_LOGADO = '/techrecruiter-logado';
const ROUTE_EVERYMIND_LOGADO = '/EveryMind-logado';
const ROUTE_INSERIR_TECHRECRUITER = '/inserir-techrecruiter';
const ROUTE_INSERIR_EVERYMIND = '/inserir-EveryMind';
const ROUTE_TODOS_TECHRECRUITERS = '/todos-techrecruiters';
const ROUTE_PESQUISAR_TECH = '/pesquisar-tech';
const ROUTE_PERFIL_USUARIO = '/perfil-usuario';
const ROUTE_APLICAR_VAGA = '/aplicar-vaga/:id';
const ROUTE_TODAS_CANDIDATURAS = '/todas-candidaturas';
const ROUTE_TODAS_CANDIDATURAS_ADMIN = '/todas-candidaturas-admin';
const ROUTE_VAGAS_APLICADAS_USUARIO = '/vagas-aplicadas-usuario';
const ROUTE_PESQUISAR_CANDIDATURA = '/pesquisar-candidatura';
const ROUTE_PESQUISAR_CANDIDATURA_ADMIN = '/pesquisar-candidatura-admin';
const ROUTE_CANDIDATURAS = '/candidaturas/:id';
const ROUTE_CANDIDATURAS_USER = '/candidaturas-user/:id';
const ROUTE_VISUALIZAR_CURRICULO = '/visualizar-curriculo/:filename';
const ROUTE_DOWNLOAD_CURRICULO = '/download-curriculo/:filename';
const ROUTE_FAQ = '/faq';
const ROUTE_INSERIR_FAQ = '/inserir-faq';
const ROUTE_INSERIR_PERGUNTA = '/inserir-pergunta'
const ROUTE_TODAS_PERGUNTAS = '/todas-perguntas';

app.get('/health', (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).send('database unavailable');
    return res.status(200).send('ok');
});

// Configure o middleware de sessão
const sessionStore = MongoStore.create({
    mongoUrl: mongoUri,
    collectionName: 'sessions',
    ttl: 8 * 60 * 60,
    touchAfter: 60 * 60,
});

sessionStore.on('error', (error) => {
    console.error('Erro no armazenamento de sessoes:', error.message);
});

app.use(
    session({
        name: 'everymind.sid',
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        cookie: {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 8 * 60 * 60 * 1000,
        },
    })
);

app.use(flash());

// Inicialize o Passport e o middleware de sessão
app.use(passport.initialize());
app.use(passport.session());

const { csrfSynchronisedProtection, generateToken } = csrfSync({
    getTokenFromRequest: (req) => req.body?._csrf || req.headers['x-csrf-token'],
});

app.use((req, res, next) => {
    // O Multer precisa ler o multipart antes de o token CSRF ficar disponivel.
    if (req.is('multipart/form-data')) return next();
    return csrfSynchronisedProtection(req, res, next);
});

app.use((req, res, next) => {
    res.locals.csrfToken = generateToken(req);
    next();
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
});

// Configure o Passport para usar a estratégia Local com o modelo User
passport.use(
    new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'senha',
        },
        async (email, senha, done) => {
            try {
                // Encontre o usuário pelo email
                const user = await User.findOne({ email });

                if (!user) {
                    // Usuário não encontrado
                    return done(null, false, { message: 'Usuário/Senha incorretos' });
                }

                // Verifique a senha usando bcrypt
                bcrypt.compare(senha, user.senha, (err, res) => {
                    if (res) {
                        // Autenticação bem-sucedida, retorne o usuário autenticado
                        return done(null, user);
                    } else {
                        // Senha incorreta
                        return done(null, false, { message: 'Usuário/Senha incorretos' });
                    }
                });
            } catch (error) {
                return done(error);
            }
        }
    )
);

// Serialize e deserialize o usuário para manter o estado da sessão
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id).exec();
        done(null, user);
    } catch (error) {
        done(error);
    }
});

function hasSpecialCharacter(senha) {
    const specialCharacters = ['@', '$', '!', '%', '*', '?', '&'];
    return specialCharacters.some(char => senha.includes(char));
}

app.get(ROUTE_HOME, (req, res) => {
    res.render('home');
});

app.get(ROUTE_TODAS_VAGAS, checkAccess('usuario'), async (req, res) => {
    try {
        const area = req.query.area; // Obtenha a área escolhida a partir da consulta
        let vagas;

        if (area) {
            vagas = await Vaga.find({ area }); // Filtrar vagas pela área escolhida
        } else {
            vagas = await Vaga.find(); // Se nenhuma área for especificada, busque todas as vagas
        }

        res.render('todas-vagas', { vagas, area });
    } catch (error) {
        console.error('Erro ao buscar vagas:', error);
        res.redirect(ROUTE_USUARIO_LOGADO); // Você pode redirecionar para a página inicial em caso de erro
    }
});

app.post(ROUTE_TODAS_VAGAS, checkAccess('usuario'), async (req, res) => {
    res.render('todas-vagas', { user: req.user });
});

app.get(ROUTE_TODAS_VAGAS_DISPONIVEIS, checkAccess('tech'), async (req, res) => {
    try {
        let vagas;
        vagas = await Vaga.find(); // Se nenhuma área for especificada, busque todas as vagas

        res.render('todas-vagas-disponiveis', { vagas });
    } catch (error) {
        console.error('Erro ao buscar vagas:', error);
        res.redirect(ROUTE_TECHRECRUITER_LOGADO); // Você pode redirecionar para a página inicial em caso de erro
    }
});

app.post(ROUTE_TODAS_VAGAS_DISPONIVEIS, checkAccess('tech'), async (req, res) => {
    res.render('todas-vagas', { user: req.user });
});

app.get(ROUTE_VAGAS, async (req, res) => {
    try {
        const vaga = await Vaga.findById(req.params.id);
        res.render('vagas', { vaga });
    } catch (error) {
        console.error('Erro ao buscar vaga por ID:', error);
        res.redirect(ROUTE_TODAS_VAGAS_DISPONIVEIS); // Redirecionar para a página inicial em caso de erro
    }
});


app.get(ROUTE_INSERIR_VAGA, checkAccess('tech'), (req, res) => {
    res.render('inserir-vaga');
});

app.post(ROUTE_INSERIR_VAGA, checkAccess('tech'), async (req, res) => {
    const { titulo, empresa, cargo_de_atuacao, salario, local, descricao } = req.body;
    const techt = req.user.nome;

    const novaVaga = new Vaga({
        titulo,
        empresa,
        cargo_de_atuacao,
        salario,
        local,
        descricao,
        tech: techt,
    });

    try {
        await novaVaga.save();
        console.log('Vaga inserida no MongoDB');
        res.redirect(ROUTE_TECHRECRUITER_LOGADO);
    } catch (error) {
        console.error('Erro ao inserir vaga:', error);
        res.redirect(ROUTE_INSERIR_VAGA); // Redirecionar de volta ao formulário em caso de erro
    }
});

app.get(ROUTE_EXCLUIR_VAGA, checkAccess('tech'), async (req, res) => {
    try {
        const vaga = await Vaga.findById(req.params.id);
        if (!vaga) return res.status(404).send('Vaga nao encontrada');
        if (!canManageVaga(req, vaga)) return res.status(403).send('Acesso negado');
        res.render('excluir-vaga', { vaga });
    } catch (error) {
        console.error('Erro ao buscar vaga para exclusão:', error);
        res.redirect(ROUTE_TECHRECRUITER_LOGADO); // Redirecionar para a página inicial em caso de erro
    }
});

app.post(ROUTE_EXCLUIR_VAGA, checkAccess('tech'), async (req, res) => {
    try {
        const vaga = await Vaga.findById(req.params.id);
        if (!vaga) return res.status(404).send('Vaga nao encontrada');
        if (!canManageVaga(req, vaga)) return res.status(403).send('Acesso negado');
        await vaga.deleteOne();

        console.log('Vaga excluída do MongoDB');
        res.redirect(ROUTE_TODAS_VAGAS_DISPONIVEIS);
    } catch (error) {
        console.error('Erro ao excluir vaga:', error);
        res.redirect(`/excluir-vaga/${req.params.id}`); // Redirecionar de volta à página de exclusão em caso de erro
    }
});

app.get(ROUTE_EDITAR_VAGA, checkAccess('tech'), async (req, res) => {
    try {
        const vaga = await Vaga.findById(req.params.id);
        if (!vaga) return res.status(404).send('Vaga nao encontrada');
        if (!canManageVaga(req, vaga)) return res.status(403).send('Acesso negado');
        res.render('editar-vaga', { vaga });
    } catch (error) {
        console.error('Erro ao buscar vaga para edição:', error);
        res.redirect(`/vagas/${req.params.id}`); // Redirecionar para a página inicial em caso de erro
    }
});

app.post(ROUTE_EDITAR_VAGA, checkAccess('tech'), async (req, res) => {
    const { titulo, empresa, salario, local, descricao } = req.body;

    try {
        const vagaAtual = await Vaga.findById(req.params.id);
        if (!vagaAtual) return res.status(404).send('Vaga nao encontrada');
        if (!canManageVaga(req, vagaAtual)) return res.status(403).send('Acesso negado');
        await Vaga.findByIdAndUpdate(req.params.id, {
            titulo,
            empresa,
            salario,
            local,
            descricao,
        });

        console.log('Vaga editada no MongoDB');
        res.redirect(ROUTE_TODAS_VAGAS_DISPONIVEIS);
    } catch (error) {
        console.error('Erro ao editar vaga:', error);
        res.redirect(`/editar-vaga/${req.params.id}`); // Redirecionar de volta à página de edição em caso de erro
    }
});

app.get(ROUTE_EDITAR_STATUS_CANDIDATURA, checkAccess('tech'), async (req, res) => {
    try {
        const candidatura = await AplicadoVaga.findById(req.params.id);
        if (!candidatura) return res.status(404).send('Candidatura nao encontrada');
        if (!canAccessCandidatura(req, candidatura)) return res.status(403).send('Acesso negado');
        res.render('editar-candidaturas', { candidatura });
    } catch (error) {
        console.error('Erro ao buscar vaga para edição:', error);
        res.redirect(`/candidaturas/${req.params.id}`); // Redirecionar para a página inicial em caso de erro
    }
});

app.post(ROUTE_EDITAR_STATUS_CANDIDATURA, checkAccess('tech'), async (req, res) => {
    const { status } = req.body;
    const statusPermitidos = ['Aplicado', 'Reprovado', 'Selecionado', 'Testes', 'Entrevista', 'Aprovado', 'Finalizada'];
    if (!statusPermitidos.includes(status)) return res.status(400).send('Status invalido');

    try {
        const candidatura = await AplicadoVaga.findById(req.params.id);
        if (!candidatura) return res.status(404).send('Candidatura nao encontrada');
        if (!canAccessCandidatura(req, candidatura)) return res.status(403).send('Acesso negado');
        candidatura.status = status;
        await candidatura.save();

        console.log('Status editado no MongoDB');
        res.redirect(ROUTE_TODAS_CANDIDATURAS);
    } catch (error) {
        console.error('Erro ao editar candidaturas:', error);
        res.redirect(`/editar-candidaturas/${req.params.id}`); // Redirecionar de volta à página de edição em caso de erro
    }
});

app.get(ROUTE_PESQUISAR, checkAccess('usuario'), async (req, res) => {
    const queryCargo = escapeRegex(req.query.q_cargo); // Obtenha o valor do campo "Cargo de atuação" da consulta
    const queryLocal = escapeRegex(req.query.q_local); // Obtenha o valor do campo "Local" da consulta
    const queryCargo2 = escapeRegex(req.query.q_cargo2);


    try {
        let resultados;
        let query = "";

        if (queryCargo && queryLocal) {
            // Se ambos os campos de pesquisa estão preenchidos, filtre com base em ambos
            resultados = await Vaga.find({
                $and: [
                    { cargo_de_atuacao: { $regex: queryCargo, $options: 'i' } },
                    { local: { $regex: queryLocal, $options: 'i' } },
                ],
            });
            query = `Cargo: ${queryCargo}, Local: ${queryLocal}`;
        } else if (queryCargo) {
            // Se apenas o campo de "Cargo de atuação" está preenchido, filtre com base nele
            resultados = await Vaga.find({
                cargo_de_atuacao: { $regex: queryCargo, $options: 'i' },
            });
            query = `Cargo: ${queryCargo}`;
        } else if (queryLocal) {
            // Se apenas o campo "Local" está preenchido, filtre com base nele
            resultados = await Vaga.find({
                local: { $regex: queryLocal, $options: 'i' },
            });
            query = `Local: ${queryLocal}`;
        } else if (queryCargo2) {
            // Se apenas o campo "Local" está preenchido, filtre com base nele
            resultados = await Vaga.find({
                cargo_de_atuacao: { $regex: queryCargo2, $options: 'i' },
            });
            query = `cargo: ${queryCargo2}`;
        } else {
            // Se nenhum campo de pesquisa estiver preenchido, retorne todas as vagas
            resultados = await Vaga.find({});
        }

        res.render('pesquisa', { resultados, query });
    } catch (error) {
        console.error('Erro ao realizar a pesquisa:', error);
        res.redirect('/todas-vagas');
    }
});

// Login de usuário
app.get(ROUTE_LOGIN, (req, res) => {
    res.render('login');
});

app.post(ROUTE_LOGIN, loginLimiter, passport.authenticate('local', {
    successRedirect: '/redirect', // Redirecionar para uma rota intermediária
    failureRedirect: '/login?erro=Usuário/Senha incorretos',
    failureFlash: true,
}));

// Rota intermediária para redirecionamento com base no tipo de usuário
app.get('/redirect', checkAuthenticated, (req, res) => {
    // Verifique o tipo de usuário e redirecione com base nele
    const tipo = req.user.tipo;
    if (tipo === 'usuario') {
        res.redirect(ROUTE_USUARIO_LOGADO);
    } else if (tipo === 'tech') {
        res.redirect(ROUTE_TECHRECRUITER_LOGADO);
    } else if (tipo === 'everyMind') {
        res.redirect(ROUTE_EVERYMIND_LOGADO);
    } else {
        res.redirect(ROUTE_LOGIN);
    }
});

// Rota para inserção de usuário
app.get(ROUTE_INSERIR_USUARIO, (req, res) => {
    res.render('inserir-usuario');
});

app.post(ROUTE_INSERIR_USUARIO, async (req, res) => {
    const { nome, email, senha, raca, genero, pcd, vulnerabilidade } = req.body;

    try {

        // Verificar se o usuário já existe com o mesmo e-mail
        const usuarioExistente = await User.findOne({ email });

        if (usuarioExistente) {
            // Se o usuário já existir, chame a função para mostrar o pop-up com a mensagem
            return res.render('inserir-usuario', { mensagem: 'Um usuário com este e-mail já existe.' });
        }
        // Verifique se o "nome" contém apenas letras (sem números)
        const nomeRegex = /^[A-Za-z]+$/;

        if (!nomeRegex.test(nome)) {
            // Se o nome não atender aos requisitos, mostre o pop-up com a mensagem
            return res.render('inserir-usuario', { mensagem: 'O "nome" deve conter apenas letras (sem números ou caracteres especiais).' });
        }

        // Defina a expressão regular para verificar os requisitos
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

        // Verifique se a senha atende aos requisitos mínimos
        if (!regex.test(senha)) {
            return res.render('inserir-usuario', { mensagem: 'A senha não atende aos requisitos mínimos.' });
        }

        // Verifique se a senha contém pelo menos um caractere especial
        if (!hasSpecialCharacter(senha)) {
            return res.render('inserir-usuario', { mensagem: 'A senha deve conter pelo menos um caractere especial.'});
        }

        // Gere um hash de senha usando o bcrypt
        const hashedSenha = await bcrypt.hash(senha, 10);

        // Crie um novo usuário com a senha criptografada
        const novoUsuario = new User({
            nome,
            email,
            senha: hashedSenha,
            raca,
            genero,
            pcd,
            vulnerabilidade,
            tipo: "usuario",
        });

        await novoUsuario.save();
        console.log('Usuário inserido no MongoDB');
        res.redirect('/');
    } catch (error) {
        console.error('Erro ao inserir usuário:', error);
        res.redirect(ROUTE_INSERIR_USUARIO);
    }
});

// Rota para Voltar
app.get(ROUTE_USUARIO_LOGADO, checkAccess('usuario'), (req, res) => {
    res.render('usuario-logado', { user: req.user });
});

// Rota para Voltar
app.post(ROUTE_USUARIO_LOGADO, checkAccess('usuario'), async (req, res) => {
    res.render('usuario-logado', { user: req.user });
});

// Rota para Voltar
app.get(ROUTE_TECHRECRUITER_LOGADO, checkAccess('tech'), (req, res) => {
    res.render('techrecruiter-logado', { user: req.user });
});

// Rota para Voltar
app.get(ROUTE_EVERYMIND_LOGADO, checkAccess('everyMind'), (req, res) => {
    res.render('EveryMind-logado', { user: req.user });
});

// Rota para inserção de Tech Recruiter
app.get(ROUTE_INSERIR_TECHRECRUITER, checkAccess('everyMind'), (req, res) => {
    res.render('inserir-techrecruiter');
});

app.post(ROUTE_INSERIR_TECHRECRUITER, checkAccess('everyMind'), async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
        // Verificar se o usuário já existe com o mesmo e-mail
        const usuarioExistente = await User.findOne({ email });

        if (usuarioExistente) {
            // Se o usuário já existir, chame a função para mostrar o pop-up com a mensagem
            return res.render('inserir-techrecruiter', { mensagem: 'Um tech recruiter com este e-mail já existe.' });
        }

        // Verifique se o "nome" contém apenas letras (sem números)
        const nomeRegex = /^[A-Za-z]+$/;

        if (!nomeRegex.test(nome)) {
            return res.render('inserir-techrecruiter', { mensagem: 'O "nome" deve conter apenas letras (sem números ou caracteres especiais).'});
        }

        // Defina a expressão regular para verificar os requisitos
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

        // Verifique se a senha atende aos requisitos mínimos
        if (!regex.test(senha)) {
            return res.render('inserir-techrecruiter', { mensagem: 'A senha não atende aos requisitos mínimos.'});
        }

        // Verifique se a senha contém pelo menos um caractere especial
        if (!hasSpecialCharacter(senha)) {
            return res.render('inserir-techrecruiter', { mensagem: 'A senha deve conter pelo menos um caractere especial.'});
        }

        // Gere um hash de senha usando o bcrypt
        const hashedSenha = await bcrypt.hash(senha, 10);

        // Crie um novo Tech Recruiter com a senha criptografada
        const novoUsuario = new User({
            nome,
            email,
            senha: hashedSenha,
            tipo: "tech",
        });

        await novoUsuario.save();
        console.log('Tech Recruiter inserido no MongoDB');
        res.redirect('EveryMind-logado');
    } catch (error) {
        console.error('Erro ao inserir Tech Recruiter:', error);
        res.redirect('inserir-techrecruiter');
    }
});

app.get(ROUTE_INSERIR_EVERYMIND, checkAccess('everyMind'), (req, res) => {
    res.render('inserir-EveryMind');
});

app.post(ROUTE_INSERIR_EVERYMIND, checkAccess('everyMind'), async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
        // Verificar se o usuário já existe com o mesmo e-mail
        const usuarioExistente = await User.findOne({ email });

        if (usuarioExistente) {
            // Se o usuário já existir, chame a função para mostrar o pop-up com a mensagem
            return res.render('inserir-EveryMind', { mensagem: 'Um administrador com este e-mail já existe.' });
        }

        // Verifique se o "nome" contém apenas letras (sem números)
        const nomeRegex = /^[A-Za-z]+$/;

        if (!nomeRegex.test(nome)) {
            return res.render('inserir-EveryMind', { mensagem: 'O "nome" deve conter apenas letras (sem números ou caracteres especiais).'});
        }

        // Defina a expressão regular para verificar os requisitos
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

        // Verifique se a senha atende aos requisitos mínimos
        if (!regex.test(senha)) {
            return res.render('inserir-EveryMind', { mensagem: 'A senha não atende aos requisitos mínimos.'});
        }

        // Verifique se a senha contém pelo menos um caractere especial
        if (!hasSpecialCharacter(senha)) {
            return res.render('inserir-EveryMind', { mensagem: 'A senha deve conter pelo menos um caractere especial.'});
        }

        // Gere um hash de senha usando o bcrypt
        const hashedSenha = await bcrypt.hash(senha, 10); // O número 10 é o custo de processamento, você pode ajustá-lo

        // Crie um novo usuário com a senha criptografada
        const novoUsuario = new User({
            nome,
            email,
            senha: hashedSenha, // Armazene o hash da senha no banco de dados
            tipo: "everyMind",
        });

        await novoUsuario.save();
        console.log('Administrador inserido no MongoDB');
        res.redirect('EveryMind-logado');
    } catch (error) {
        console.error('Erro ao inserir administrador:', error);
        res.redirect('inserir-EveryMind');
    }
});

app.get(ROUTE_TODOS_TECHRECRUITERS, checkAccess('everyMind'), async (req, res) => {
    try {
        const techrecruiters = await User.find({ tipo: 'tech' });

        res.render('todos-techrecruiters', { techrecruiters });
    } catch (error) {
        console.error('Erro ao buscar vagas:', error);
        res.redirect(ROUTE_EVERYMIND_LOGADO); // Você pode redirecionar para a página inicial em caso de erro
    }
});

app.get(ROUTE_PESQUISAR_TECH, checkAccess('tech'), async (req, res) => {
    const queryCargo = escapeRegex(req.query.q_cargo); // Obtenha o valor do campo "Cargo de atuação" da consulta
    const queryLocal = escapeRegex(req.query.q_local); // Obtenha o valor do campo "Local" da consulta

    try {
        let resultados;
        let query = "";

        if (queryCargo && queryLocal) {
            // Se ambos os campos de pesquisa estão preenchidos, filtre com base em ambos
            resultados = await Vaga.find({
                $and: [
                    { cargo_de_atuacao: { $regex: queryCargo, $options: 'i' } },
                    { local: { $regex: queryLocal, $options: 'i' } },
                ],
            });
            query = `Cargo: ${queryCargo}, Local: ${queryLocal}`;
        } else if (queryCargo) {
            // Se apenas o campo de "Cargo de atuação" está preenchido, filtre com base nele
            resultados = await Vaga.find({
                cargo_de_atuacao: { $regex: queryCargo, $options: 'i' },
            });
            query = `Cargo: ${queryCargo}`;
        } else if (queryLocal) {
            // Se apenas o campo "Local" está preenchido, filtre com base nele
            resultados = await Vaga.find({
                local: { $regex: queryLocal, $options: 'i' },
            });
            query = `Local: ${queryLocal}`;
        } else {
            // Se nenhum campo de pesquisa estiver preenchido, retorne todas as vagas
            resultados = await Vaga.find({});
        }

        res.render('pesquisa-tech', { resultados, query });
    } catch (error) {
        console.error('Erro ao realizar a pesquisa:', error);
        res.redirect(ROUTE_TODAS_VAGAS_DISPONIVEIS);
    }
});

// Rota para a página de perfil
app.get(ROUTE_PERFIL_USUARIO, checkAccess('usuario'), (req, res) => {
    const user = req.user; // Supondo que você tenha autenticado o usuário
    if (!user) {
        // Redirecione para a página de login ou exiba uma mensagem de erro
        return res.redirect(ROUTE_LOGIN);
    }

    // Renderize a página de perfil e passe o usuário como contexto
    res.render('perfil-usuario', { user });
});

app.get(ROUTE_APLICAR_VAGA, checkAccess('usuario'), async (req, res) => {
    try {
        const vaga = await Vaga.findById(req.params.id);
        res.render('aplicar-vaga', { vaga });
    } catch (error) {
        console.error('Erro ao buscar vaga por ID:', error);
        res.redirect(ROUTE_TODAS_VAGAS_DISPONIVEIS); // Redirecionar para a página inicial em caso de erro
    }
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        const isPdf = file.mimetype === 'application/pdf'
            && path.extname(file.originalname).toLowerCase() === '.pdf';
        if (!isPdf) return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'pdfFile'));
        return cb(null, true);
    },
});


app.post(ROUTE_APLICAR_VAGA, checkAccess('usuario'), upload.single('pdfFile'), csrfSynchronisedProtection, async (req, res) => {
    try {
        // Recupere os dados do formulário
        const vagaId = req.params.id;
        const nome = req.user.nome;
        const email = req.user.email;
        const raca = req.user.raca;
        const genero = req.user.genero;
        const vulnerabilidade = req.user.vulnerabilidade;
        const { cel } = req.body;

        // Verifique se a vaga com o ID fornecido existe
        const vaga = await Vaga.findById(vagaId);
        if (!vaga) {
            return res.status(404).send('Vaga não encontrada');
        }
        const techUser = vaga.tech;

        // Verifique se o arquivo foi enviado corretamente
        if (!req.file) {
            return res.status(400).send('Nenhum arquivo enviado.');
        }

        const pdfBuffer = req.file.buffer;
        if (pdfBuffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
            return res.status(400).send('O arquivo enviado nao e um PDF valido.');
        }

        // Converta o buffer em uma string Base64
        const pdfBase64 = pdfBuffer.toString('base64');

        const safeOriginalName = path.basename(req.file.originalname)
            .normalize('NFKD')
            .replace(/[^\x00-\x7F]/g, '')
            .replace(/[^A-Za-z0-9._-]/g, '_')
            .slice(-100) || 'curriculo.pdf';
        const storedFilename = `${crypto.randomUUID()}-${safeOriginalName}`;

        // Crie um objeto de candidatura com os detalhes
        const candidatura = new AplicadoVaga({
            vaga: vagaId, // O ID da vaga a que a candidatura se refere
            tech: techUser,
            titulo: vaga.titulo, // Supondo que você tem um campo "titulo" no seu formulário
            nome,
            email,
            cel,
            status: "Aplicado",
            raca,
            genero,
            vulnerabilidade,
            pdf: {
                filename: storedFilename,
                content: pdfBase64,
            },
        });

        // Salve a candidatura em AplicadoVaga
        await candidatura.save();

        let vagas;
        vagas = await Vaga.find(); // Se nenhuma área for especificada, busque todas as vagas

        // Redirecione para a página de sucesso ou faça o que desejar
        res.render('todas-vagas', { vagas });
    } catch (error) {
        console.error('Erro ao aplicar a vaga:', error);
        res.status(500).send('Erro no servidor');
    }
});

app.get(ROUTE_TODAS_CANDIDATURAS, checkAccess('tech'), async (req, res) => {
    try {
        const tech = req.user.nome
        // Busque todas as candidaturas relacionadas ao Tech Recruiter logado com base no ID dele.
        const candidaturas = await AplicadoVaga.find({ tech });
        // console.log(candidaturas)
        res.render('todas-candidaturas', { candidaturas });
    } catch (error) {
        console.error('Erro ao buscar vagas:', error);
        res.redirect(ROUTE_TECHRECRUITER_LOGADO); // Você pode redirecionar para a página inicial em caso de erro
    }
});

app.get(ROUTE_TODAS_CANDIDATURAS_ADMIN, checkAccess('everyMind'), async (req, res) => {
    try {
        let candidaturas;
        candidaturas = await AplicadoVaga.find(); // Se nenhuma área for especificada, busque todas as vagas
        res.render('todas-candidaturas-admin', { candidaturas });
    } catch (error) {
        console.error('Erro ao buscar vagas:', error);
        res.redirect(ROUTE_TECHRECRUITER_LOGADO); // Você pode redirecionar para a página inicial em caso de erro
    }
});

app.get(ROUTE_VAGAS_APLICADAS_USUARIO, checkAccess('usuario'), async (req, res) => {
    try {
        const email = req.user.email
        // Busque todas as candidaturas relacionadas ao Tech Recruiter logado com base no ID dele.
        const candidaturas = await AplicadoVaga.find({ email });
        // console.log(candidaturas)
        res.render('vagas-aplicadas-usuario', { candidaturas });
    } catch (error) {
        console.error('Erro ao buscar vagas:', error);
        res.redirect(ROUTE_USUARIO_LOGADO); // Você pode redirecionar para a página inicial em caso de erro
    }
});

app.get(ROUTE_PESQUISAR_CANDIDATURA, checkAccess('tech'), async (req, res) => {
    const queryNome = escapeRegex(req.query.q_nome); // Obtenha o valor do campo "Nome" da consulta
    const queryEmail = escapeRegex(req.query.q_email); // Obtenha o valor do campo "Email" da consulta

    try {
        let resultados;
        let query = "";
        const tech = req.user.nome; // Certifique-se de definir a variável 'tech'

        if (queryNome && queryEmail) {
            // Se ambos os campos de pesquisa estão preenchidos, filtre com base em ambos
            resultados = await AplicadoVaga.find({
                tech,
                $and: [
                    { nome: { $regex: queryNome, $options: 'i' } },
                    { email: { $regex: queryEmail, $options: 'i' } },
                ],
            });
            query = `Nome: ${queryNome}, Email: ${queryEmail}`;

        } else if (queryNome) {
            // Se apenas o campo de "Nome" está preenchido, filtre com base nele
            resultados = await AplicadoVaga.find({
                tech,
                nome: { $regex: queryNome, $options: 'i' },
            });
            query = `Nome: ${queryNome}`;
        } else if (queryEmail) {
            // Se apenas o campo "Email" está preenchido, filtre com base nele
            resultados = await AplicadoVaga.find({
                tech,
                email: { $regex: queryEmail, $options: 'i' },
            });
            query = `Email: ${queryEmail}`;
        } else {
            // Se nenhum campo de pesquisa estiver preenchido, retorne todas as candidaturas do tech recruiter logado
            resultados = await AplicadoVaga.find({ tech });
        }
        res.render('pesquisar-candidatura', { resultados, query });
    } catch (error) {
        console.error('Erro ao realizar a pesquisa:', error);
        res.redirect(ROUTE_TODAS_CANDIDATURAS);
    }
});

app.get(ROUTE_PESQUISAR_CANDIDATURA_ADMIN, checkAccess('everyMind'), async (req, res) => {
    const queryNome = escapeRegex(req.query.q_nome); // Obtenha o valor do campo "Nome" da consulta
    const queryEmail = escapeRegex(req.query.q_email); // Obtenha o valor do campo "Email" da consulta

    try {
        let resultados;
        let query = "";

        if (queryNome && queryEmail) {
            // Se ambos os campos de pesquisa estão preenchidos, filtre com base em ambos
            resultados = await AplicadoVaga.find({
                $and: [
                    { nome: { $regex: queryNome, $options: 'i' } },
                    { email: { $regex: queryEmail, $options: 'i' } },
                ],
            });
            query = `Nome: ${queryNome}, Email: ${queryEmail}`;

        } else if (queryNome) {
            // Se apenas o campo de "Nome" está preenchido, filtre com base nele
            resultados = await AplicadoVaga.find({
                nome: { $regex: queryNome, $options: 'i' },
            });
            query = `Nome: ${queryNome}`;
        } else if (queryEmail) {
            // Se apenas o campo "Email" está preenchido, filtre com base nele
            resultados = await AplicadoVaga.find({
                email: { $regex: queryEmail, $options: 'i' },
            });
            query = `Email: ${queryEmail}`;
        } else {
            // Se nenhum campo de pesquisa estiver preenchido, retorne todas as candidaturas do tech recruiter logado
            resultados = await AplicadoVaga.find({});
        }
        res.render('pesquisar-candidatura-admin', { resultados, query });
    } catch (error) {
        console.error('Erro ao realizar a pesquisa:', error);
        res.redirect(ROUTE_TODAS_CANDIDATURAS);
    }
});

app.get(ROUTE_CANDIDATURAS, checkAccessAny('tech', 'everyMind'), async (req, res) => {
    try {
        const candidatura = await AplicadoVaga.findById(req.params.id);
        if (!candidatura) {
            return res.status(404).send('Candidatura não encontrada');
        }
        if (!canAccessCandidatura(req, candidatura)) return res.status(403).send('Acesso negado');

        res.render('candidaturas', { candidatura });
    } catch (error) {
        console.error('Erro ao buscar candidaturas por ID:', error);
        res.redirect(ROUTE_TODAS_CANDIDATURAS); // Redirecionar para a página inicial em caso de erro
    }
});

app.get(ROUTE_CANDIDATURAS_USER, checkAccess('usuario'), async (req, res) => {
    try {
        const candidatura = await AplicadoVaga.findById(req.params.id);
        if (!candidatura) {
            return res.status(404).send('Candidatura não encontrada');
        }
        if (!canAccessCandidatura(req, candidatura)) return res.status(403).send('Acesso negado');

        res.render('candidaturas-user', { candidatura });
    } catch (error) {
        console.error('Erro ao buscar candidaturas por ID:', error);
        res.redirect(ROUTE_CANDIDATURAS_USER); // Redirecionar para a página inicial em caso de erro
    }
});

app.get(ROUTE_VISUALIZAR_CURRICULO, checkAuthenticated, async (req, res) => {
    try {
        const filename1 = req.params.filename;

        // Procure o documento com base no nome do arquivo PDF
        const documento = await AplicadoVaga.findOne({ 'pdf.filename': filename1 });

        if (!documento) {
            return res.status(404).send('Documento não encontrado');
        }
        if (!canAccessCandidatura(req, documento)) return res.status(403).send('Acesso negado');

        const { filename, content } = documento.pdf;

        // Renderize uma página EJS para exibir o PDF, passando candidatura como uma variável
        res.render('visualizar-curriculo', {
            candidatura: { pdf: { filename, content } }, // Passando candidatura com a propriedade pdf
        });
    } catch (error) {
        console.error('Erro ao recuperar o PDF:', error);
        res.status(500).send('Erro ao recuperar o PDF');
    }
});

app.get(ROUTE_DOWNLOAD_CURRICULO, checkAuthenticated, async (req, res) => {
    try {
        const filename1 = req.params.filename;

        // Procure o documento com base no nome do arquivo PDF
        const documento = await AplicadoVaga.findOne({ 'pdf.filename': filename1 });

        if (!documento) {
            return res.status(404).send('Documento não encontrado');
        }
        if (!canAccessCandidatura(req, documento)) return res.status(403).send('Acesso negado');

        const { filename, content } = documento.pdf;

        // Configurar os cabeçalhos de resposta para forçar o download
        res.setHeader('Content-Type', 'application/pdf');
        const downloadName = path.basename(filename).replace(/[^A-Za-z0-9._-]/g, '_');
        res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);

        // Envie o PDF como resposta
        res.end(Buffer.from(content, 'base64'));
    } catch (error) {
        console.error('Erro ao recuperar o PDF:', error);
        res.status(500).send('Erro ao recuperar o PDF');
    }
});

app.get(ROUTE_FAQ, async (req, res) => {
    try {
        let perguntas;
        perguntas = await Perguntas.find(); // Se nenhuma área for especificada, busque todas as vagas

        res.render('faq', { perguntas });
    } catch (error) {
        console.error('Erro ao buscar vagas:', error);
        res.redirect(ROUTE_HOME); // Você pode redirecionar para a página inicial em caso de erro
    }
});

app.post(ROUTE_FAQ, async (req, res) => {
    res.render('faq');
});

app.get(ROUTE_INSERIR_FAQ, checkAccess('tech'), (req, res) => {
    res.render('inserir-faq');
});

app.post(ROUTE_INSERIR_FAQ, checkAccess('tech'), async (req, res) => {
    const { topico, resposta } = req.body;

    const novoTopico = new Perguntas({
        topico,
        resposta,
    });

    try {
        await novoTopico.save();
        console.log('Topico inserida no MongoDB');
        res.redirect(ROUTE_TECHRECRUITER_LOGADO);
    } catch (error) {
        console.error('Erro ao inserir topico:', error);
        res.redirect(ROUTE_INSERIR_FAQ); // Redirecionar de volta ao formulário em caso de erro
    }
});

app.get(ROUTE_INSERIR_PERGUNTA, checkAccess('usuario'), (req, res) => {
    res.render('inserir-pergunta');
});

app.post(ROUTE_INSERIR_PERGUNTA, checkAccess('usuario'), async (req, res) => {
    const { pergunta } = req.body;

    const novoPerguntaUser = new PerguntasUser({
        pergunta,

    });

    try {
        await novoPerguntaUser.save();
        console.log('Pergunta inserida no MongoDB');
        res.redirect(ROUTE_USUARIO_LOGADO);
    } catch (error) {
        console.error('Erro ao inserir pergunta:', error);
        res.redirect(ROUTE_INSERIR_PERGUNTA); // Redirecionar de volta ao formulário em caso de erro
    }
});

app.get(ROUTE_TODAS_PERGUNTAS, checkAccess('tech'), async (req, res) => {
    try {
        let perguntas;

        perguntas = await PerguntasUser.find(); // Se nenhuma área for especificada, busque todas as vagas


        res.render('todas-perguntas', { perguntas });
    } catch (error) {
        console.error('Erro ao buscar vagas:', error);
        res.redirect(ROUTE_USUARIO_LOGADO); // Você pode redirecionar para a página inicial em caso de erro
    }
});

app.post(ROUTE_TODAS_PERGUNTAS, checkAccess('tech'), async (req, res) => {
    res.render('todas-vagas', { user: req.user });
});

app.post(ROUTE_LOGOUT, checkAuthenticated, (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            // Handle any errors that occur during logout
            return next(err);
        }
        // Redirect the user to a different page after logout
        res.redirect(ROUTE_LOGIN);
    });
});

app.use((req, res) => {
    res.status(404).send('Pagina nao encontrada');
});

app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).send('Sessao ou formulario expirado. Atualize a pagina e tente novamente.');
    }
    if (err instanceof multer.MulterError) {
        return res.status(400).send('Envie somente um arquivo PDF de ate 5 MB.');
    }
    console.error('Erro nao tratado:', err);
    return res.status(500).send('Erro interno do servidor');
});

async function startServer() {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10_000 });
    app.listen(port, () => {
        console.log(`Servidor rodando em http://localhost:${port}`);
    });
}

if (require.main === module) {
    startServer().catch((error) => {
        console.error('Falha ao iniciar o servidor:', error.message);
        process.exit(1);
    });
}

module.exports = app;
