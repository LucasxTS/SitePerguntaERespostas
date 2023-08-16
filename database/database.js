const Sequelize = require('sequelize')
const connection = new Sequelize('lucas', 'root', 'admin',{
    host: 'localhost',
    dialect: 'mysql'
})

module.exports=connection /*  */