const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require("fs");
const Vaga = require('./models/Vaga');
const User = require('./models/User'); // Importe o modelo de usuário
const TechRecruiter = require('./models/TechRecruiter')
const EveryMind = require('./models/EveryMind')
const AplicadoVaga = require('./models/Aplicado-Vaga');
const PDFModel = require('./models/PDFModel');

// const speakeasy = require('speakeasy');
// const qrcode = require('qrcode');

const app = express()

//
mongoose.connect('mongodb://localhost/EveryMind', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});


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
const ROUTE_LOGIN_USUARIO = '/login-usuario';
const ROUTE_USUARIO_LOGADO = '/usuario-logado';
const ROUTE_INSERIR_USUARIO = '/inserir-usuario';
const ROUTE_LOGIN_TECHRECRUITER = '/login-techrecruiter';
const ROUTE_TECHRECRUITER_LOGADO = '/techrecruiter-logado';
const ROUTE_EVERYMIND_LOGADO = '/EveryMind-logado';
const ROUTE_INSERIR_TECHRECRUITER = '/inserir-techrecruiter';
const ROUTE_LOGIN_EVERYMIND = '/login-EveryMind';
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

var user = '';
var techRecruiter = '';
var everyMind = '';

app.get(ROUTE_HOME, (req, res) => {
    res.render('home');
});

app.get(ROUTE_TODAS_VAGAS, async (req, res) => {
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

app.post(ROUTE_TODAS_VAGAS, async (req,res) => {
    // const user = await User.findOne(req.params.id);
    res.render('todas-vagas', { user });
});

app.get(ROUTE_TODAS_VAGAS_DISPONIVEIS, async (req, res) => {
    try {
        let vagas;
        vagas = await Vaga.find(); // Se nenhuma área for especificada, busque todas as vagas

        res.render('todas-vagas-disponiveis', { vagas });
    } catch (error) {
        console.error('Erro ao buscar vagas:', error);
        res.redirect(ROUTE_TECHRECRUITER_LOGADO); // Você pode redirecionar para a página inicial em caso de erro
    }
});

app.post(ROUTE_TODAS_VAGAS_DISPONIVEIS, async (req,res) => {
    // const user = await User.findOne(req.params.id);
    res.render('todas-vagas', { user });
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


app.get(ROUTE_INSERIR_VAGA, (req, res) => {
    res.render('inserir-vaga');
});

app.post(ROUTE_INSERIR_VAGA, async (req, res) => {
    const { titulo, empresa, cargo_de_atuacao, salario, local, descricao } = req.body;

    const novaVaga = new Vaga({
        titulo,
        empresa,
        cargo_de_atuacao,
        salario,
        local,
        descricao,
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

app.get(ROUTE_EXCLUIR_VAGA, async (req, res) => {
    try {
        const vaga = await Vaga.findById(req.params.id);
        res.render('excluir-vaga', { vaga });
    } catch (error) {
        console.error('Erro ao buscar vaga para exclusão:', error);
        res.redirect(ROUTE_TECHRECRUITER_LOGADO); // Redirecionar para a página inicial em caso de erro
    }
});

app.post(ROUTE_EXCLUIR_VAGA, async (req, res) => {
    try {
        await Vaga.findByIdAndDelete(req.params.id);

        console.log('Vaga excluída do MongoDB');
        res.redirect(ROUTE_TODAS_VAGAS_DISPONIVEIS);
    } catch (error) {
        console.error('Erro ao excluir vaga:', error);
        res.redirect(`/excluir-vaga/${req.params.id}`); // Redirecionar de volta à página de exclusão em caso de erro
    }
});

app.get(ROUTE_EDITAR_VAGA, async (req, res) => {
    try {
        const vaga = await Vaga.findById(req.params.id);
        res.render('editar-vaga', { vaga });
    } catch (error) {
        console.error('Erro ao buscar vaga para edição:', error);
        res.redirect(`/vagas/${req.params.id}`); // Redirecionar para a página inicial em caso de erro
    }
});

app.post(ROUTE_EDITAR_VAGA, async (req, res) => {
    const { titulo, empresa, salario, local, descricao } = req.body;

    try {
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

app.get(ROUTE_EDITAR_STATUS_CANDIDATURA, async (req, res) => {
    try {
        const candidatura = await AplicadoVaga.findById(req.params.id);
        res.render('editar-candidaturas', { candidatura });
    } catch (error) {
        console.error('Erro ao buscar vaga para edição:', error);
        res.redirect(`/candidaturas/${req.params.id}`); // Redirecionar para a página inicial em caso de erro
    }
});

app.post(ROUTE_EDITAR_STATUS_CANDIDATURA, async (req, res) => {
    const { vaga, tech, titulo, nome, email, cel, status, pdf } = req.body;

    try {
        await AplicadoVaga.findByIdAndUpdate(req.params.id, {
            vaga,
            tech,
            titulo,
            nome,
            email,
            cel,
            status,
            pdf,
        });

        console.log('Status editado no MongoDB');
        res.redirect(ROUTE_TODAS_CANDIDATURAS);
    } catch (error) {
        console.error('Erro ao editar candidaturas:', error);
        res.redirect(`/editar-candidaturas/${req.params.id}`); // Redirecionar de volta à página de edição em caso de erro
    }
});

app.get(ROUTE_PESQUISAR, async (req, res) => {
    const queryCargo = req.query.q_cargo; // Obtenha o valor do campo "Cargo de atuação" da consulta
    const queryLocal = req.query.q_local; // Obtenha o valor do campo "Local" da consulta
    const queryCargo2 = req.query.q_cargo2;
    let user;
    user = await User.findOne(req.params.id);

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
app.get(ROUTE_LOGIN_USUARIO, (req, res) => {
    res.render('login-usuario');
});

app.post(ROUTE_LOGIN_USUARIO, async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Verifique as credenciais do usuário no banco de dados
        user = await User.findOne({ email }).exec();

        if (!user) {
            // Usuário não encontrado
            return res.status(401).redirect('/login-usuario?erro=Usuário/Senha incorretos');
        }

        // Verifique a senha usando bcrypt
        const senhaCorreta = await bcrypt.compare(senha, user.senha);

        if (!senhaCorreta) {
            // Senha incorreta
            return res.status(401).redirect('/login-usuario?erro=Usuário/Senha incorretos');
        }

        // if (user.is2FAEnabled) {
        //     // Verifique o código 2FA
        //     const isVerified = speakeasy.totp.verify({
        //         secret: user.secret2FA,
        //         encoding: 'base32',
        //         token,
        //         window: 2, // Permite alguma margem de tempo para códigos expirados
        //     });

        //     if (!isVerified) {
        //         return res.status(401).json({ error: 'Código 2FA inválido' });
        //     }
        // }
        // Autenticação bem-sucedida
        res.render('usuario-logado', { user: user });

    } catch (error) {
        console.error('Erro no login de usuário:', error);
        res.status(500).send('Erro no servidor');
    }
});

// Rota para inserção de usuário
app.get(ROUTE_INSERIR_USUARIO, (req, res) => {
    res.render('inserir-usuario');
});

app.post(ROUTE_INSERIR_USUARIO, async (req, res) => {
    const { username, email, senha, raca, genero, pcd, vulnerabilidade } = req.body;

    try {
        // Gere um hash de senha usando o bcrypt
        const hashedSenha = await bcrypt.hash(senha, 10);

        // Crie um novo usuário com a senha criptografada
        const novoUsuario = new User({
            username,
            email,
            senha: hashedSenha,
            raca,
            genero,
            pcd,
            vulnerabilidade,
        });

        await novoUsuario.save();
        console.log('Usuário inserido no MongoDB');
        res.redirect('/');
    } catch (error) {
        console.error('Erro ao inserir usuário:', error);
        res.redirect(ROUTE_INSERIR_USUARIO);
    }
});

// Login de Tech Recruiter
app.get(ROUTE_LOGIN_TECHRECRUITER, (req, res) => {
    res.render('login-techrecruiter');
});

app.post(ROUTE_LOGIN_TECHRECRUITER, async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Verifique as credenciais do Tech Recruiter no banco de dados
        techRecruiter = await TechRecruiter.findOne({ email }).exec();

        if (!techRecruiter) {
            // Tech Recruiter não encontrado
            res.render('login-techrecruiter')
            return res.status(401).send('Usuário/Senha incorretos');
        }

        // Verifique a senha usando bcrypt
        const senhaCorreta = await bcrypt.compare(senha, techRecruiter.senha);

        if (!senhaCorreta) {
            // Senha incorreta
            res.render('login-techrecruiter')
            return res.status(401).send('Usuário/Senha incorretos');
        }

        // Autenticação bem-sucedida
        res.render('techrecruiter-logado', { techRecruiter });

    } catch (error) {
        console.error('Erro no login de Tech Recruiter:', error);
        res.status(500).send('Erro no servidor');
    }
});

// Rota para Voltar
app.get(ROUTE_USUARIO_LOGADO, (req, res) => {
    res.render('usuario-logado', {user});
});

// Rota para Voltar
app.post(ROUTE_USUARIO_LOGADO, async (req, res) => {
    // const user = await User.findOne(req.params.id);
    console.log(user)
    res.render('usuario-logado', { user });
});

// Rota para Voltar
app.get(ROUTE_TECHRECRUITER_LOGADO, (req, res) => {
    res.render('techrecruiter-logado', {techRecruiter});
});

// Rota para Voltar
app.get(ROUTE_EVERYMIND_LOGADO, (req, res) => {
    res.render('EveryMind-logado', {everyMind});
});

// Rota para inserção de Tech Recruiter
app.get(ROUTE_INSERIR_TECHRECRUITER, (req, res) => {
    res.render('inserir-techrecruiter');
});

app.post(ROUTE_INSERIR_TECHRECRUITER, async (req, res) => {
    const { username, email, senha } = req.body;

    try {
        // Gere um hash de senha usando o bcrypt
        const hashedSenha = await bcrypt.hash(senha, 10);

        // Crie um novo Tech Recruiter com a senha criptografada
        const novoTechRecruiter = new TechRecruiter({
            username,
            email,
            senha: hashedSenha,
        });

        await novoTechRecruiter.save();
        console.log('Tech Recruiter inserido no MongoDB');
        res.redirect('EveryMind-logado');
    } catch (error) {
        console.error('Erro ao inserir Tech Recruiter:', error);
        res.redirect('inserir-techrecruiter');
    }
});

app.get(ROUTE_LOGIN_EVERYMIND, (req, res) => {
    res.render('login-EveryMind'); // Renderize a página de login do usuário
});

app.post(ROUTE_LOGIN_EVERYMIND, async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Verifique as credenciais do usuário no banco de dados
        everyMind = await EveryMind.findOne({ email }).exec();

        if (!everyMind) {
            // Usuário não encontrado
            //res.render('login-EveryMind')
            return res.status(401).send('Usuário/Senha incorretos');
        }

        // Verifique a senha usando bcrypt
        const senhaCorreta = await bcrypt.compare(senha, everyMind.senha);

        if (!senhaCorreta) {
            // Senha incorreta
            //res.render('login-EveryMind')
            return res.status(401).send('Usuário/Senha incorretos');
        }

        // Autenticação bem-sucedida
        res.render('EveryMind-logado', {everyMind});

    } catch (error) {
        console.error('Erro no login de EveryMind:', error);
        res.status(500).send('Erro no servidor');
    }
});

app.get(ROUTE_INSERIR_EVERYMIND, (req, res) => {
    res.render('inserir-EveryMind');
});

app.post(ROUTE_INSERIR_EVERYMIND, async (req, res) => {
    const { username, email, senha } = req.body;

    try {
        // Gere um hash de senha usando o bcrypt
        const hashedSenha = await bcrypt.hash(senha, 10); // O número 10 é o custo de processamento, você pode ajustá-lo

        // Crie um novo usuário com a senha criptografada
        const novoEveryMind = new EveryMind({
            username,
            email,
            senha: hashedSenha, // Armazene o hash da senha no banco de dados
        });

        await novoEveryMind.save();
        console.log('Administrador inserido no MongoDB');
        res.redirect('EveryMind-logado');
    } catch (error) {
        console.error('Erro ao inserir administrador:', error);
        res.redirect('inserir-EveryMind');
    }
});

app.get(ROUTE_TODOS_TECHRECRUITERS, async (req, res) => {
    try {
        let techrecruiters;
        techrecruiters = await TechRecruiter.find(); // Se nenhuma área for especificada, busque todas as vagas

        res.render('todos-techrecruiters', { techrecruiters });
    } catch (error) {
        console.error('Erro ao buscar vagas:', error);
        res.redirect(ROUTE_EVERYMIND_LOGADO); // Você pode redirecionar para a página inicial em caso de erro
    }
});

app.get(ROUTE_PESQUISAR_TECH, async (req, res) => {
    const queryCargo = req.query.q_cargo; // Obtenha o valor do campo "Cargo de atuação" da consulta
    const queryLocal = req.query.q_local; // Obtenha o valor do campo "Local" da consulta

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
app.get(ROUTE_PERFIL_USUARIO, (req, res) => {
    const user = req.user; // Supondo que você tenha autenticado o usuário
    if (!user) {
        // Redirecione para a página de login ou exiba uma mensagem de erro
        return res.redirect(ROUTE_LOGIN_USUARIO);
    }

    // Renderize a página de perfil e passe o usuário como contexto
    res.render('perfil-usuario', { user });
});

app.get(ROUTE_APLICAR_VAGA, async (req, res) => {
    try {
        const vaga = await Vaga.findById(req.params.id);
        res.render('aplicar-vaga', { vaga });
    } catch (error) {
        console.error('Erro ao buscar vaga por ID:', error);
        res.redirect(ROUTE_TODAS_VAGAS_DISPONIVEIS); // Redirecionar para a página inicial em caso de erro
    }
});

// Configuração do armazenamento para o multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads'); // Diretório onde os PDFs serão temporariamente salvos
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Use o nome original do arquivo
    }
});

const upload = multer({ storage: storage });


app.post(ROUTE_APLICAR_VAGA, upload.single('pdfFile'), async (req, res) => {
    try {
        // user = await User.findOne(req.params.id);
        // Recupere os dados do formulário
        const vagaId = req.params.id;
        nome = user.username;
        email = user.email;
        raca = user.raca;
        genero = user.genero;
        vulnerabilidade = user.vulnerabilidade;
        const {cel} = req.body;
        
        // Verifique se a vaga com o ID fornecido existe
        const vaga = await Vaga.findById(vagaId);
        const techUser = vaga.tech;

        if (!vaga) {
            return res.status(404).send('Vaga não encontrada');
        }

        // Verifique se o arquivo foi enviado corretamente
        if (!req.file) {
            return res.status(400).send('Nenhum arquivo enviado.');
        }

        // Leia o arquivo PDF em um buffer
        const pdfBuffer = fs.readFileSync(req.file.path);

        // Converta o buffer em uma string Base64
        const pdfBase64 = pdfBuffer.toString('base64');

        // Salve a string Base64 no banco de dados MongoDB
        const pdfDocument = new PDFModel({
            filename: req.file.originalname,
            content: pdfBase64,
        });

        await pdfDocument.save();

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
                filename: req.file.originalname,
                content: pdfBase64,
            },
        });

        // Salve a candidatura em AplicadoVaga
        await candidatura.save();

        // Exclua o arquivo temporário após a conversão e salvamento
        fs.unlinkSync(req.file.path);

        let vagas;
        vagas = await Vaga.find(); // Se nenhuma área for especificada, busque todas as vagas

        // Redirecione para a página de sucesso ou faça o que desejar
        res.render('todas-vagas', { vagas });
    } catch (error) {
        console.error('Erro ao aplicar a vaga:', error);
        res.status(500).send('Erro no servidor');
    }
});

app.get(ROUTE_TODAS_CANDIDATURAS, async (req, res) => {
    try {
        // Certifique-se de que o Tech Recruiter está autenticado e você tem acesso às informações dele.
        // if (!req.techRecruiter) {
        //     return res.redirect(ROUTE_LOGIN_TECHRECRUITER); // Redireciona para a página de login se o Tech Recruiter não estiver autenticado ou não tiver a função correta.
        // }

        // const techRecruiterUser = req.techRecruiter.username; // Supondo que o ID do Tech Recruiter esteja disponível no objeto de usuário.
        const tech = techRecruiter.username
        // console.log(tech);
        // Busque todas as candidaturas relacionadas ao Tech Recruiter logado com base no ID dele.
        const candidaturas = await AplicadoVaga.find({ tech });
        // console.log(candidaturas)
        res.render('todas-candidaturas', { candidaturas });

        // let candidaturas;
        // candidaturas = await AplicadoVaga.find(); // Se nenhuma área for especificada, busque todas as vagas

        // res.render('todas-candidaturas', { candidaturas });
    } catch (error) {
        console.error('Erro ao buscar vagas:', error);
        res.redirect(ROUTE_TECHRECRUITER_LOGADO); // Você pode redirecionar para a página inicial em caso de erro
    }
});

app.get(ROUTE_TODAS_CANDIDATURAS_ADMIN, async (req, res) => {
    try {
        let candidaturas;
        candidaturas = await AplicadoVaga.find(); // Se nenhuma área for especificada, busque todas as vagas
        res.render('todas-candidaturas-admin', { candidaturas });
    } catch (error) {
        console.error('Erro ao buscar vagas:', error);
        res.redirect(ROUTE_TECHRECRUITER_LOGADO); // Você pode redirecionar para a página inicial em caso de erro
    }
});

app.get(ROUTE_VAGAS_APLICADAS_USUARIO, async (req, res) => {
    try {
        // Certifique-se de que o Tech Recruiter está autenticado e você tem acesso às informações dele.
        // if (!req.techRecruiter) {
        //     return res.redirect(ROUTE_LOGIN_TECHRECRUITER); // Redireciona para a página de login se o Tech Recruiter não estiver autenticado ou não tiver a função correta.
        // }

        // const techRecruiterUser = req.techRecruiter.username; // Supondo que o ID do Tech Recruiter esteja disponível no objeto de usuário.
        const email = user.email
        // Busque todas as candidaturas relacionadas ao Tech Recruiter logado com base no ID dele.
        const candidaturas = await AplicadoVaga.find({ email });
        // console.log(candidaturas)
        res.render('vagas-aplicadas-usuario', { candidaturas });

        // let candidaturas;
        // candidaturas = await AplicadoVaga.find(); // Se nenhuma área for especificada, busque todas as vagas

        // res.render('todas-candidaturas', { candidaturas });
    } catch (error) {
        console.error('Erro ao buscar vagas:', error);
        res.redirect(ROUTE_USUARIO_LOGADO); // Você pode redirecionar para a página inicial em caso de erro
    }
});

app.get(ROUTE_PESQUISAR_CANDIDATURA, async (req, res) => {
    const queryNome = req.query.q_nome; // Obtenha o valor do campo "Nome" da consulta
    const queryEmail = req.query.q_email; // Obtenha o valor do campo "Email" da consulta

    try {
        let resultados;
        let query = "";
        tech = techRecruiter.username // Certifique-se de definir a variável 'tech'
        
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

app.get(ROUTE_PESQUISAR_CANDIDATURA_ADMIN, async (req, res) => {
    const queryNome = req.query.q_nome; // Obtenha o valor do campo "Nome" da consulta
    const queryEmail = req.query.q_email; // Obtenha o valor do campo "Email" da consulta

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
            resultados = await AplicadoVaga.find({ tech });
        }
        res.render('pesquisar-candidatura-admin', { resultados, query });
    } catch (error) {
        console.error('Erro ao realizar a pesquisa:', error);
        res.redirect(ROUTE_TODAS_CANDIDATURAS);
    }
});

app.get(ROUTE_CANDIDATURAS, async (req, res) => {
    try {
        const candidatura = await AplicadoVaga.findById(req.params.id);
        if (!candidatura) {
            return res.status(404).send('Candidatura não encontrada');
        }

        res.render('candidaturas', { candidatura });
    } catch (error) {
        console.error('Erro ao buscar candidaturas por ID:', error);
        res.redirect(ROUTE_TODAS_CANDIDATURAS); // Redirecionar para a página inicial em caso de erro
    }
});

app.get(ROUTE_CANDIDATURAS_USER, async (req, res) => {
    try {
        const candidatura = await AplicadoVaga.findById(req.params.id);
        if (!candidatura) {
            return res.status(404).send('Candidatura não encontrada');
        }

        res.render('candidaturas-user', { candidatura });
    } catch (error) {
        console.error('Erro ao buscar candidaturas por ID:', error);
        res.redirect(ROUTE_CANDIDATURAS_USER); // Redirecionar para a página inicial em caso de erro
    }
});

app.get(ROUTE_VISUALIZAR_CURRICULO, async (req, res) => {
    try {
        const filename1 = req.params.filename;

        // Procure o documento com base no nome do arquivo PDF
        const documento = await AplicadoVaga.findOne({ 'pdf.filename': filename1 });

        if (!documento) {
            return res.status(404).send('Documento não encontrado');
        }

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

app.get(ROUTE_DOWNLOAD_CURRICULO, async (req, res) => {
    try {
        const filename1 = req.params.filename;

        // Procure o documento com base no nome do arquivo PDF
        const documento = await AplicadoVaga.findOne({ 'pdf.filename': filename1 });

        if (!documento) {
            return res.status(404).send('Documento não encontrado');
        }

        const { filename, content } = documento.pdf;

        // Configurar os cabeçalhos de resposta para forçar o download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        // Envie o PDF como resposta
        res.end(Buffer.from(content, 'base64'));
    } catch (error) {
        console.error('Erro ao recuperar o PDF:', error);
        res.status(500).send('Erro ao recuperar o PDF');
    }
});


// app.post('/ativar-2fa', async (req, res) => {
//     const userId = req.user.id; // Você deve ter uma maneira de identificar o usuário logado

//     try {
//         // Gere uma chave secreta 2FA única para o usuário
//         const secret = speakeasy.generateSecret({ length: 20 });

//         // Salve a chave secreta no modelo de usuário
//         const user = await User.findById(userId);
//         user.secret2FA = secret.base32;
//         user.is2FAEnabled = true; // Marque o 2FA como ativado
//         await user.save();

//         // Envie a chave secreta ao cliente (para geração de código de backup, se necessário)
//         res.json({ secret: secret.base32 });
//     } catch (error) {
//         console.error('Erro ao ativar o 2FA:', error);
//         res.status(500).json({ error: 'Erro no servidor' });
//     }
// });

// app.get('/exibir-qr', (req, res) => {
//     const userId = req.user.id; // Você deve ter uma maneira de identificar o usuário logado

//     // Recupere a chave secreta do usuário
//     User.findById(userId)
//         .then((user) => {
//             if (!user || !user.secret2FA) {
//                 return res.status(404).json({ error: '2FA não ativado para este usuário' });
//             }

//             // Gere o código QR
//             const otpauthUrl = speakeasy.otpauthURL({
//                 secret: user.secret2FA,
//                 label: 'Nome do Seu Aplicativo',
//                 issuer: 'Sua Empresa',
//             });

//             qrcode.toDataURL(otpauthUrl, (err, imageUrl) => {
//                 if (err) {
//                     console.error('Erro ao gerar o código QR:', err);
//                     res.status(500).json({ error: 'Erro ao gerar o código QR' });
//                 } else {
//                     // Exiba a imagem do código QR para o usuário
//                     res.send(`<img src="${imageUrl}" alt="Código QR">`);
//                 }
//             });
//         })
//         .catch((error) => {
//             console.error('Erro ao buscar usuário:', error);
//             res.status(500).json({ error: 'Erro no servidor' });
//         });
// });
