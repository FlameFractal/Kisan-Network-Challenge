const path = require('path')
const request = require('request')
const express = require('express')
const app = express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

function getContactList(){
	/* Fetch JSON of Contact List once */
	const contactListJSONUrl = process.env.contactListJSONUrl
	request({
	    url: contactListJSONUrl,
	    json: true
	}, function (error, response, body) {
	    if (!error && response.statusCode === 200) {
			getContactList.contactList = body
	    } else {
	    	console.log(error)
	    }
	})
}

function addSentSMS(msg){
	if(typeof setSetSMS.sentSMS == 'undefined')
		addSentSMS.sentSMS = {}
	addSentSMS.sentSMS.push(msg)
}

function initTwilio(){
	/* Twilio Setup */
	initTwilio.twilioConfig = {
		accountSid : process.env.accountSid,
		authToken : process.env.authToken,
		twilioNumber : process.env.twilioNumber	
	}
	initTwilio.client = require('twilio')(initTwilio.twilioConfig.accountSid, initTwilio.twilioConfig.authToken)
}


/* Define all the routes here */

// home page
app.get('/',function(req, res){
	try{
		// sort sms by descending time
		sentSMS = addSentSMS.sentSMS.sort((a,b) => {return b.time - a.time})
		res.render('pages/index',{
			contactList: getContactList.contactList,
			sentSMS: sentSMS
		})	
	} catch (e) {
		console.log(e)
		return res.render('pages/err500') 
	}
})

// Render info page - if the contact ID exists
app.get('/contactInfo/:contactId',function(req, res){
	try{
		var contactId = req.params.contactId
		contact = getContactList.contactList.find(c => c.id === parseInt(contactId))
		console.log(contact.name)
 		res.render('pages/contactInfo', {
			contact : contact,
		})
	} catch (e) {
		console.log(e)
		return res.render('pages/err500') 
	}
})

// Render otp page - if the contact ID exists
app.get('/sendSMS/:contactId',function(req, res){
	try {
		var contactId = req.params.contactId
		contact = getContactList.contactList.find(c => c.id === parseInt(contactId))
		contact.otp = Math.floor(Math.random()*(999999-100000)+100000)
		res.render('pages/sendSMS', {
			contact : contact
		})
	} catch (e) {
		console.log(e)
		return res.render('pages/err500') 
	}
})

// Send twilio otp sms - if the contact ID exists & add suucesfull entry to Sent SMS object array
app.get('/sendTwilio/:contactId', function(req, res){
	try{
		var contactId = req.params.contactId
		contact = getContactList.contactList.find(c => c.id === parseInt(contactId))
		initTwilio.client.messages
		  .create({
		     body: 'Your OTP is'+contact.otp,
		     from: initTwilio.twilioConfig.twilioNumber,
		     to: contact.mobile
		   })
		  .then(message => console.log(message.sid))
		  .catch(e => { console.error('Got an error:', e.code, e.message); });

	    addSentSMS({"name": contact.name, "time": Date.now(), "otp": contact.otp})

		res.render('pages/sendTwilio', {
			otp: contact.otp
		})
	} catch (e) {
		console.log(e)
		return res.render('pages/err500') 
	}
})

// start the server
port = process.env.PORT || 3000
getContactList()
initTwilio()
app.listen(port)