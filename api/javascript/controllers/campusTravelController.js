const { TravelPostModel, TravelChatModel, ReplyPostModel } = require("../models/campusTravelModel");
const mongoose = require("mongoose")

var nodemailer = require('nodemailer');

// Create the transporter with the required configuration for Outlook
// change the user and pass !

const sendEmail = (receiver,rec_name, sender_name, from, to, travelDateTime )=>{

    const time = travelDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });;
    const date = travelDateTime.toLocaleDateString('en-GB');

    console.log("Date = ", date)
    console.log("Time = ", time)

    var transporter = nodemailer.createTransport({
        host: "smtp-mail.outlook.com", // hostname
        secureConnection: false, // TLS requires secureConnection to be false
        port: 587, // port for secure SMTP
        tls: {
           ciphers:'SSLv3'
        },
        auth: {
            user: '<SWC Email Id>',
            pass: '<Account password>'
        }
    });
    
    // setup e-mail data, even with unicode symbols
    var mailOptions = {
        from: '"One Stop IITG - SWC " j.pandey@iitg.ac.in', // sender address (who sends)
        to: receiver, // list of receivers (who receives)
        subject: 'Reply recieved - Cab Sharing', // Subject line
        text: 'Hello ', // plaintext body
        html: '<b>Hello '+rec_name+'</b><br> You got a reply from '+sender_name+' on your upcoming cab sharing request from '+from+' to '+to+'.'+'<div class="style="padding-y:2px""></div>'+'<div>Travel Date: '+date+' </div>'+'<div>Travel Time: '+time+' </div>', // html body
        text: 'Team SWC', // plaintext body
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
    
        console.log('Message sent: ' + info.response);
    });
}

// send mail with defined transport object





exports.postTravel = async (req, res) => {
    try {
        let travelDateTime = new Date(req.body.travelDateTime);
        let chatModel = new TravelChatModel();
        chatModel = await chatModel.save();
        let data = { "email": req.body.email, "name": req.body.name, "travelDateTime": travelDateTime, "to": req.body.to, "from": req.body.from, "margin": req.body.margin, "note": req.body.note, "chatId": chatModel.id };
        if ("phonenumber" in req.body) data["phonenumber"] = req.body.phonenumber;
        let travelModel = new TravelPostModel(data);
        await travelModel.save();
        console.log(travelModel);
        res.json({ "success": true });
    }
    catch (err) {
        res.json({ "success": false, "message": err.toString() });
    }
}


function getFormattedDate(travelDateTime) {
    var options = { year: 'numeric', month: 'short', day: 'numeric' };
    let date = travelDateTime.toLocaleDateString("en-US", options);
    console.log(date);
    let d = date[5] == ',' ? parseInt(date[4]) : parseInt(date.substring(4, 6));
    let suff;
    console.log(d % 10, date.substring(5, 7));
    if (d > 3 && d < 21) suff = 'th';
    else {
        switch (d % 10) {
            case 1:
                suff = "st";
                break;
            case 2:
                suff = "nd";
                break;
            case 3:
                suff = "rd";
                break;
            default:
                suff = "th";
                break;
        }
    }
    date = date[5] == ',' ? date.slice(0, 5) + suff + date.slice(5) : date.slice(0, 6) + suff + date.slice(6);
    return date;
}

exports.getTravelPosts = async (req, res) => {
    try {
        if (req.query.travelDateTime === undefined) {
            let date = new Date();
            // date.toDateString();
            date = new Date(date.toISOString().split("T")[0]);
            req.query.travelDateTime = date.toISOString();
        }
        let lowerDate = new Date(req.query.travelDateTime);
        let upperDate = new Date(req.query.travelDateTime);
        console.log("here", req.query.travelDateTime);
        upperDate.setDate(upperDate.getDate() + 1);
        console.log(req.body);
        console.log(lowerDate, upperDate);
        // console.log(req.query.to===undefined);
        let travelPosts = await TravelPostModel.find(
            req.query.to===undefined ? {
            travelDateTime: {
                $gte: lowerDate
            }
        } : {
            travelDateTime: {
                $gte: lowerDate,
                $lt: upperDate
            }, to: req.query.to, from: req.query.from
        }).sort({ "travelDateTime": 1 });
        console.log(travelPosts);
        let datewiseTravelPost = {};
        travelPosts.forEach((element) => {
            let date = getFormattedDate(element["travelDateTime"]);
            console.log(typeof (date), date);
            if (date in datewiseTravelPost) {
                datewiseTravelPost[date].push(element);
            }
            else datewiseTravelPost[date] = [element];
        });
        res.json({ "success": true, "details": datewiseTravelPost });
    }
    catch (err) {
        res.json({ "success": false, "message": err.toString() });
    }
}

exports.deleteTravelPost = async (req, res) => {
    try {
        const id = req.query.travelPostId;
        let travelPost = await TravelPostModel.findById(id);
        if (travelPost["email"] !== req.body.email) {
            res.json({ "success": false, "message": "Email doesn't match" });
            return;
        }
        await TravelChatModel.findByIdAndDelete(travelPost["chatId"]);
        await TravelPostModel.findByIdAndDelete(id);
        res.json({ "success": true });
    }
    catch (err) {
        res.json({ "success": false, "message": err.toString() });
    }
}

exports.deleteAllTravelPosts = async (req, res) => {
    try {
        await TravelPostModel.deleteMany();
        res.json({ "success": true });
    }
    catch (err) {
        res.json({ "success": false, "message": err.toString() });
    }
}

exports.getMyAds = async (req, res) => {
    try {
        const email = req.query.email;
        let myTravelPosts = await TravelPostModel.find({ "email": email });
        res.json({ "success": true, "details": myTravelPosts });
    }
    catch (err) {
        res.json({ "success": false, "message": err.toString() });
    }
}

exports.getTravelPostChatReplies = async (req, res) => {
    try {
        const id = req.query.chatId;
        console.log(id);
        let travelChat = await TravelChatModel.findById(id);
        res.json({ "success": true, "replies": travelChat["replies"] });
    }
    catch (err) {
        res.json({ "success": false, "message": err.toString() });
    }
}

exports.postReplyChat = async (req, res) => {
    try {
        const id = req.query.chatId;
        console.log(id);
        const data = req.body;
        let travelChatReply = new ReplyPostModel(data);
        let travelChat = await TravelChatModel.findById(id);
        const user = await TravelPostModel.findOne({chatId:id});
        console.log(user);
        travelChat["replies"].push(travelChatReply);
        travelChat = await travelChat.save();
        console.log(travelChat);
        sendEmail(user.email, user.name, req.body.name, user.from, user.to, user.travelDateTime);
        res.json({ "success": true });
    }
    catch (err) {
        res.json({ "success": false, "message": err.toString() });
    }
}

