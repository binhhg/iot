const mongoose = require('mongoose')
const temperatureSchema = new mongoose.Schema({
    values: [{
        _id: false,
        value: {
            type: Number,
            required: true
        }
    }],
    times: [{
        _id: false,
        time: {
            type: Number,
            required: true
        }

    }]
},{timestamps: true},{collection: 'temperature'}
)

temperatureSchema.methods.generateValueandTime = async function(value, time) {
    // Generate an auth token for the user
    const temp = this
    // console.log(temp.values.length);
    if(temp.values.length >= 100){
        temp.values = []
        temp.times = []
    }
    temp.values = temp.values.concat({value})
    temp.times = temp.times.concat({time})
    await temp.save()
    return {value, time}
}

const temperatureSchemaModel = mongoose.model('temperature', temperatureSchema);
module.exports = temperatureSchemaModel
