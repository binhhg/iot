const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const mqtt = require('mqtt')
const Light = require('./models/Light')
const Humidity = require('./models/Humidity')
const Temperature = require('./models/Temperature')
require("dotenv").config()
const db = require('./helpers/config').CONNECTION_STRING

app = express();
app.use(cors());
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/img', express.static(__dirname + 'public/img'))
app.set("view engine", "ejs")
app.set("views", "./views")

function strcmp(a, b) {
    if (a.toString() < b.toString()) return -1
    if (a.toString() > b.toString()) return 1
    return 0
}

const port = process.env.PORT || 3000
const server = require("http").Server(app)
const io = require("socket.io")(server)
// console.log(process.env.JWT_KEY)
mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883')
temperatureTopic = 'tbt/dht/temperature'
humidityTopic = 'tbt/dht/humidity'
led1Topic = 'tbt/led/1'
led2Topic = 'tbt/led/2'
flameTopic = 'tbt/flame'
firTopic = 'tbt/fir'

mqttClient.on('connect', () => {
    console.log('Mqtt connected.')
    mqttClient.subscribe(temperatureTopic, {qos: 0})
    mqttClient.subscribe(humidityTopic, {qos: 0})
    mqttClient.subscribe(led1Topic, {qos: 0})
    mqttClient.subscribe(led2Topic, {qos: 0})
    mqttClient.subscribe(flameTopic, {qos: 0})
    mqttClient.subscribe(firTopic, {qos: 0})
})

mqttClient.on('offline', () => {
    console.log('Mqtt offline.')
})

mqttClient.on('error', (err) => {
    console.log(err)
    mqttClient.end()
});

mqttClient.on('message', async function (topic, message) {
    if (strcmp(topic, flameTopic) === 0) {
        io.sockets.emit('flame', 'Fire Warning')
    }
    if (strcmp(topic, firTopic) === 0) {
        this.sendLed1('on')
        this.sendLed2('on')
    }
    if (strcmp(topic, led1Topic) === 0) {
        // console.log(message.toString())
        // io.sockets.emit('humidity', parsedMessage.humidity);
        // io.sockets.emit('temperature', parsedMessage.temperature);
        const newData = new Light()
        newData.id = 1
        if (strcmp(message, 'off') === 0) {
            newData.status = 'false'
        } else if (strcmp(message, 'on') === 0) {
            newData.status = 'true'
        }
        const light = {
            id: newData.id,
            status: newData.status
        }
        if (newData.id !== null && newData.status !== null) {
            Light.findOneAndUpdate({id: newData.id}, light, {upsert: true}, function (err, doc) {
                if (err) console.log(err)
            })
        }
    }
    if (strcmp(topic, led2Topic) === 0) {
        // console.log(message.toString())
        // io.sockets.emit('temperature', parsedMessage.temperature);
        var newdata = new Light();
        newdata.id = 2;
        if (strcmp(message, 'off') === 0) {
            newdata.status = 'false';
        } else if (strcmp(message, 'on') === 0) {
            newdata.status = 'true';
        }
        var light = {
            id: newdata.id,
            status: newdata.status
        };
        if (newdata.id != null && newdata.status != null) {
            Light.findOneAndUpdate({id: newdata.id}, light, {upsert: true}, function (err, doc) {
                if (err) console.log(err)
            });
        }
    }
    if (strcmp(topic, humidityTopic) === 0) {
        // console.log(message.toString())
        const hvalue = parseFloat(message.toString());
        // console.log(hvalue)
        console.log(hvalue)
        io.sockets.emit('humidity', message.toString());
        const humidity = await Humidity.findOne({})
        if (!humidity) {
            const hum = new Humidity(null, null)
            hum.generateValueandTime(hvalue, 0)
        } else {
            humidity.generateValueandTime(hvalue, 0)
            // for(var i =0; i<humidity.values.length; i++){
            //     console.log(humidity.values[i].value)
            // }
        }
    }
    if (strcmp(topic, temperatureTopic) === 0) {
        // console.log(message.toString())
        const tvalue = parseFloat(message.toString())
        // console.log(tvalue)
        io.sockets.emit('temperature', tvalue)
        const temperature = await Temperature.findOne({})
        if (!temperature) {
            const tem = new Temperature(null, null)
            tem.generateValueandTime(tvalue, 0)
        } else {
            temperature.generateValueandTime(tvalue, 0)
        }
    }
});

mqttClient.sendLed1 = function sendLed1(message) {
    mqttClient.publish(led1Topic, message)
}

mqttClient.sendLed2 = function sendLed2(message) {
    mqttClient.publish(led2Topic, message)
}

module.exports = mqttClient

mongoose
    .connect(db, {useFindAndModify: false})
    .then(() => {
        console.log("Database is connect")
    })
    .catch(err => {
        console.log('Error: ', err.message)
    });

const UserRouter = require('./controllers/UserRoute')
const DataRouter = require('./controllers/DataRoute')
app.use('/api/users', UserRouter)
app.use('/api/datas', DataRouter)

server.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})

io.on("connection", function (socket) {
    console.log("co nguoi ket noi: ", socket.id)
    // io.sockets.emit('Alldata', "parsedMessage");
})

app.get("", function (req, res) {
    res.render("home")
})

app.get("/login", function (req, res) {
    res.render("login")
})



