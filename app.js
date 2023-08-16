// codigo sql para correção de autenticação com mysql 
//ALTER USER 'root '@''localhost' IDENTIFIED WITH mysql_native_password BY 'admin'
 

const express = require('express') // aqui estamos importando o express 
const app = express(); // Iniciando o exepress
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.set('view engine', 'ejs')
app.use(express.static('public'))
const connection = require('./database/database.js')
const Pergunta = require("./database/Perguntas.js")
const Resposta = require("./database/Respostas.js")
const Cadastros = require("./database/Cadastros.js");
const session = require("express-session")
const bcrypt= require('bcryptjs')
const { raw } = require('mysql2');
const { where } = require('sequelize');
const Tema = require("./database/Tema");

app.use(session({
    secret: 'fernando',//É uma string que representa a chave secreta usada para assinar os cookies de sessão. Essa chave é usada para criptografar e descriptografar os dados armazenados na sessão, garantindo que apenas o servidor possa ler e escrever os dados da sessão. A chave secreta deve ser uma sequência de caracteres difícil de ser adivinhada e deve ser mantida em sigilo.
    resave: false, //É um valor booleano que indica se a sessão deve ser salva no servidor mesmo que não tenha sido modificada durante a requisição. Quando resave é false, a sessão só será salva se os dados da sessão foram modificados. Isso ajuda a evitar gravações desnecessárias no servidor e melhora a eficiência.
    saveUninitialized: true,//É um valor booleano que indica se a sessão deve ser salva no servidor, mesmo que não tenha sido inicializada. Quando saveUninitialized é true, a sessão será salva mesmo se ainda não tiver sido modificada, garantindo que uma sessão vazia seja criada para cada cliente. Isso é útil para evitar a criação de cookies desnecessários em algumas situações, mas você pode definir como false para economizar recursos se não precisar de sessões vazias.
    cookie: {
        expires: false //  É um objeto que permite definir configurações específicas para o cookie da sessão. Neste exemplo, estamos usando cookie.expires: false para fazer com que o cookie expire quando o navegador for fechado. Quando o navegador é fechado, o cookie é excluído e, portanto, a sessão também é invalidada. Se não definirmos essa propriedade ou atribuirmos uma data/hora de expiração, o cookie será armazenado em uma sessão de navegador (que geralmente dura até o usuário fechar o navegador) e a sessão permanecerá ativa mesmo que o usuário navegue para outras páginas e volte ao site.
    }
}));

async function testartoken(req, res, next) {
    if (req.session.user) {
        let usuario = req.session.user.usuario
        let token = req.session.user.token
        
        let user = await Cadastros.findOne({
              where: { Email: usuario } 
        })
           
            if (user != undefined) {
              
                if (user.Token == token) {
                    console.log("DEU")
                    next();
                } else{ res.redirect("/logout")}

            } else {res.redirect("/logout")}
      
    } else
    
    res.redirect("/logout")
}

connection
.authenticate()
.then(()=>{
    console.log("Conexão realizada com SUCESSO Com o Banco de Dados")
})
.catch((msgErr)=>{
    console.log("ERRO NA CONEXÃO COM O BANCO DE DADOS")
})

app.get('/logout', (req, res) => {
    req.session.destroy
    req.session.user = {
        usuario: "",
        token: ""
    }
    res.redirect('/');
});


app.get('/deletarpergunta/:id', testartoken, (req, res) => {
    let idPergunta = req.params.id
    let idCriadorSession = req.session.user.id
 
    Pergunta.findOne({where : {id : idPergunta}}).then(pergunta => {
                if (idCriadorSession != pergunta.criadorId) {
                    res.send("Ocorreu um erro inesperado")
                } else {
                    pergunta.destroy().then(() => {
                        Resposta.destroy({where : {PerguntaId : idPergunta}}).then(
                            res.redirect("/home")
                        ).catch(err => {
                            res.send(err)
                        })
                    }).catch(err => {
                        res.status(500).send("Erro ao excluir o item")
                    })
                }
            }).catch(err => {
                res.send(err)
            })
})


 
app.post('/salvarpergunta',(req, res) => {

    let titulo = req.body.titulo
    let Descricao = req.body.descricao
    let criador = req.session.user.id
    let criadorNome = req.session.user.nome


    if(titulo!="" && Descricao!=""){
    Pergunta.create({titulo:titulo, descricao:Descricao, criadorId:criador, criadorNome : criadorNome}).then(()=>{
    res.redirect('/home')}).catch(()=>{res.redirect('/home')})
    }else{
        res.redirect('/home')
    }
})

app.get('/deletarresposta/:idpergunta/:idresposta', testartoken, (req, res) => {
    let idpergunta = req.params.idpergunta
    let id = req.params.idresposta

    Resposta.destroy({where : {id : id}}).then(res.redirect(`/pergunta/${idpergunta}`)).catch(err => { res.send(err)})
})

app.post('/salvarresposta', (req, res) => {

    let criador = req.session.user.id
    
    let resposta = req.body.resposta
    let perguntaId = req.body.perguntaId
    let criadorResposta = req.session.user.nome
    if(resposta != "" && perguntaId != "") {

        Resposta.create({Corpo : resposta, PerguntaId : perguntaId, criadorId : criador, criadorResposta : criador}).then(() => {
            res.redirect(`/pergunta/${perguntaId}`)
         
        }).catch(()=> { 
            console.log("DEU RUIM AQUI")
            res.redirect(`/pergunta/${perguntaId}`)
        }) 

    } else {
        res.redirect(`/pergunta/${perguntaId}`)
    }
})
let testelogin=0
app.post('/testelogin', (req, res)=>{
    testelogin = 1
    res.redirect('/')

})
app.get('/',(req, res) => {
    res.render('login.ejs', {testelogin:testelogin})
   
})

app.post('/salvarcadastro', (req, res)=>{
    const salt = bcrypt.genSaltSync(10)
    let nome = req.body.nome
    let email = req.body.email
    let senha = req.body.senha
    let confirmasenha = req.body.confirmasenha

    if(nome==""||email==""||senha==""||confirmasenha==""){

    }else{
        testelogin = 0
        if(senha==confirmasenha){
        Cadastros.findOne({raw:true, where:{Email:email}}).then(existe =>{

            console.log(existe)
            if(existe==null){
                let hash = bcrypt.hashSync(senha, salt)
                let tokenhash = bcrypt.hashSync(email, salt)
                Cadastros.create({Nome:nome, Email:email, Senha:hash, Token:tokenhash})
                testelogin = 0
                res.redirect('/')
            }
        }).catch(console.log("Usuario Existente"))
    }
}

    
})

app.get('/atualizarpergunta/:id', testartoken, (req,res) => {
    let idPergunta = req.params.id
    let status = 1 
    res.render('perguntar', {
        status : status,
        id : idPergunta
    })
})

app.post('/salvaredicao', testartoken, (req, res) => {
    let idPergunta = req.body.idPergunta
    let tituloEditado = req.body.ReTitulo
    let descricaoEditada = req.body.desc

    Pergunta.findOne({where : {id : idPergunta}}).then(pergunta => {
        if(!pergunta) {
                return res.send("Pergunta não encontrada")
        }
        pergunta.update(
                {titulo : tituloEditado,
                descricao : descricaoEditada}
        ).then(() => {
            res.redirect('/home')
        })
    }).catch(err => {
        res.send("erro")
    })


})

app.post('/login', (req, res) =>{
    let email = req.body.usuario
    let senha  = req.body.senha
    const salt = bcrypt.genSaltSync(10)
     

    if(email != "" && senha != ""){
        Cadastros.findOne({where:{Email:email}}).then(cadastros => {
            let testelogin = bcrypt.compareSync(senha, cadastros.Senha)
            if(cadastros && testelogin==true)
            {
                logado = cadastros.Nome
                
                let token = bcrypt.hashSync(email, salt)
                
                cadastros.update({Token : token}).then(console.log("ATUALIZOU"))
 
                 req.session.user = {
                    usuario: cadastros.Email,
                    token: token,
                    nome: cadastros.Nome,
                    id: cadastros.id
                 }
            res.redirect('/home')
            }
            else{
                console.log("Usuario Não encontrado")
            }
            
        })  
    }
})


app.get('/home', testartoken, (req, res) => {
    req.session.comando = {
        atualizar : 0,
        resposta : 0
    }
    let v = req.session.comando.atualizar
    Pergunta.findAll({raw:true, order:[['id', 'DESC']]}).then(banco => {

        
        
        module.exports=banco
        res.render('index.ejs', {banco:banco})
    })
   
})

app.get('/perguntar', testartoken,(req, res) => {
    let status = 0
    res.render('Perguntar.ejs', {
        status : status
    })
})
app.get('/pergunta/:id', testartoken, (req, res) => {
    let perguntaId = req.params.id
    let userIdSession = req.session.user.id
    let atualizarValor = req.session.comando.atualizar
    
    Pergunta.findOne({
        where: {id : perguntaId},
        raw:true
    }).then(pergunta => {
        if(pergunta != undefined){
           
            
            Resposta.findAll({where: {PerguntaId: perguntaId},raw:true, order:[['id', 'DESC']]}).then(respostas => {
            res.render('pergunta',{
                pergunta : pergunta, respostas:respostas,
                userId : userIdSession,
                atualizar : atualizarValor
            }) 
        })}else{
           res.redirect('/')

        }
    })
})

app.get('/atualizarresposta/:idpergunta/:idresposta', testartoken, (req, res) => {
    let perguntaId = req.params.idpergunta
    let respostaId = req.params.idresposta
    req.session.comando.resposta = respostaId
    req.session.comando.atualizar = 1
    
    res.redirect(`/pergunta/${perguntaId}`)
})

app.post('/salvaratualizacao', testartoken, (req, res) => {

    let idPergunta = req.body.perguntaId
    let respostaAtualizada = req.body.resposta2
    let idResposta = req.session.comando.resposta

    if(respostaAtualizada != "") {
        Resposta.update({Corpo : respostaAtualizada}, {where : {id : idResposta}}).then(() => {
            req.session.comando.atualizar = 0
    
            res.redirect(`/pergunta/${idPergunta}`)
    
        })
        .catch(err => {
            res.send(err)
        })

    } else {
        res.redirect(`/pergunta/${idpergunta}`)
    }

   

   
})


app.listen(80, function (erro) {
    if (erro) {
        console.log("Ocorreu um erro!")
    } else {
        console.log("Servidor iniciado com sucesso")
    }
})


