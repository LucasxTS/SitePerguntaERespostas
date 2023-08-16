const Sequelize = require('sequelize')
const connection = require('./database.js')

const Pergunta = connection.define('pergunta',{
    criadorNome:{
        type: Sequelize.STRING,
        allownull: false
        },
    titulo:{
    type: Sequelize.STRING,
    allownull: false
    },
    descricao:{
        type: Sequelize.STRING,
    allownull: false
    },
    criadorId:{
        type: Sequelize.STRING,
    allownull: false
    }
    
})

// const Respostas = connection.define('respostas', {


// })






Pergunta.sync({force: false}).then(() => {
    console.log("tabela criada")
})

module.exports=Pergunta