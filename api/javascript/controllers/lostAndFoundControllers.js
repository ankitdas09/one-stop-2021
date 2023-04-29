const LostModel = require("../models/LostModel");
const FoundModel = require("../models/foundModel");
const fs = require("fs");
const path = require("path");
const uuid = require("uuid");
const sharp = require("sharp");
const mongoose = require("mongoose");

exports.getAllImages = async (req,res) => {
  let files = fs.readdirSync("../images_folder/");
  let filenames=[];
  files.forEach((file) => {
    filenames.push(file.split(".")[0]);
  });
  res.json({"details" : filenames});
}

function errorFxn(res, err) {
  console.log(err);
  return res.json({ saved_successfully: false, image_safe: true, error: err });
}


exports.getLostPageDetails = async (req, res) => {
  let page = req.query.page;
  const toSkip = (page - 1) * 5;
  const docsCount = await LostModel.countDocuments();
  if (toSkip > docsCount) {
    res.json({ result: false, details: [] });
    return;
  }
  const lostItems = await LostModel.find().sort({ "date": -1 }).skip(toSkip).limit(5);
  res.json({ result: true, details: lostItems });
}

exports.getLostDetails = async (req, res) => {
  try {
    const details = await LostModel.find();
    details.sort(compare);
    res.json({ details: details });
    return;
  } catch (error) {
    console.log(error.message);
  }
};

exports.addLostForm = async (req, res) => {
  try {
    return res.render("add_user");
  } catch (error) {
    console.log(error.message);
  }
};

exports.deleteLostAll = async (req,res) => {
  await LostModel.deleteMany({});
  res.json({success : true});
}

exports.postLostDetails = async (req, res) => {
  // if (!req.files) {
  //   return res.json({ saved_successfully: false ,status : "No file recieved"});
  //   return;
  // }
  // const file = req.files.imageToUpload;
  try {
    // console.log(req);
    var {
      title,
      location,
      phonenumber,
      description,
      imageString,
      email,
      username,
    } = req.body;
    console.log(title);
    console.log(location);
    console.log(phonenumber);
    console.log(description);
    console.log(imageString);
    // console.log(imageString);
    //console.log(uuid.v4());

    //   const image = req.file ? req.file.filename : link;

    //   if (!image) {
    //     console.log("error", "Please attach your pdf!!");
    //     return res.redirect("/Lost/raise");
    //   }
    const imageName = uuid.v4();
    const imagePath = path.resolve(
      __dirname + "/../" + "images_folder" + "/" + imageName + ".jpg"
    );
    console.log(imagePath);
    fs.writeFileSync(imagePath, Buffer.from(imageString, "base64"), (err) => {
      if (err) console.log(err);
      else {
        console.log("File written successfully\n");
      }
    });
    try {
      const metadata = await sharp(imagePath).metadata();
      console.log(metadata);
      const photo_id = imageName;
      // const imageURL =
      //   "https://swc.iitg.ac.in/onestopapi/v2/getImage?photo_id=" + imageName;
      // const compressedImageURL =
      //   "https://swc.iitg.ac.in/onestopapi/v2/getCompressedImage?photo_id=" +
      //   imageName;
      const newImagePath = path.resolve(
        __dirname +
        "/../" +
        "images_folder" +
        "/" +
        imageName +
        "-compressed.jpg"
      );
      const compressedImagePath = path.resolve(
        __dirname +
        "/../" +
        "images_folder" +
        "/" +
        imageName +
        "-ultracompressed.jpg"
      );
      //const imageURL = "https://femefun.com/contents/videos_screenshots/50000/50719/preview.mp4.jpg";
      try {
        await sharp(imagePath)
          .resize({
            width: Math.floor(metadata.width / 2),
            height: Math.floor(metadata.height / 2),
          })
          .withMetadata()
          .toFormat("jpg", { mozjpeg: true })
          .toFile(newImagePath);
        await sharp(imagePath)
          .resize({
            width: Math.floor(
              metadata.width > 5 ? metadata.width / 5 : metadata.width
            ),
            height: Math.floor(
              metadata.height > 5 ? metadata.height / 5 : metadata.height
            ),
          })
          .withMetadata()
          .toFormat("jpg", { mozjpeg: true })
          .toFile(compressedImagePath);
        console.log("Here 1");
        // console.log(imageURL);
        console.log("Here 2");
        console.log(process.env.NSFW_API_KEY);
        console.log(imagePath);
        const newLostDetail = await new LostModel({
          title,
          location,
          phonenumber,
          description,
          photo_id,
          // imageURL,
          // compressedImageURL,
          email,
          username,
        })
          .save()
          .then((result) => {
            console.log(result);
          });
        return res.json({ saved_successfully: true, image_safe: true });
      } catch (error) {
        return errorFxn(res, error);
      }
    } catch (error) {
      return errorFxn(res, error);
    }
  } catch (error) {
    return errorFxn(res, error);
  }
};

exports.postLostRemoveDetails = async (req, res) => {
  try {
    const {
      id,
      email
    } = req.body;
    console.log(id, email);
    const foundItem = await LostModel.findById(id);
    if (!foundItem) {
      res.json({
        deleted_successfully: false,
        "message": "looks something wrong"
      });
      return;
    }
    console.log(foundItem.email);
    if (foundItem.email == email) {
      await LostModel.findByIdAndDelete(id);
      res.json({
        deleted_successfully: true
      });
    } else {
      res.json({
        message: "This item does not belong to the entered email"
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// found details

exports.getFoundPageDetails = async (req, res) => {
  let page = req.query.page;
  const toSkip = (page - 1) * 5;
  const docsCount = await FoundModel.countDocuments();
  if (toSkip > docsCount) {
    res.json({ result: false, details: [] });
    return;
  }
  const foundItems = await FoundModel.find().sort({ "date": -1 }).skip(toSkip).limit(5);
  res.json({ result: true, details: foundItems });
}

exports.getfoundDetails = async (req, res) => {
  try {
    const details = await FoundModel.find();
    details.sort(compare);
    res.json({ details: details });
  } catch (error) {
    console.log(error.message);
  }
};

exports.addfoundForm = async (req, res) => {
  try {
    return res.render("addfound");
  } catch (error) {
    console.log(error.message);
  }
};

exports.claimFoundItem = async (req, res) => {
  console.log("fjkdfgh");
  try {

    const { id, claimerEmail, claimerName } = req.body;
    // console.log(req.body);
    let foundItem = await FoundModel.findById(id);
    console.log("fsdf");
    console.log(foundItem);
    if (foundItem != null && foundItem["claimed"] === true) {
      res.json({ saved: false, message: "This item already got claimed" });
      return;
    }
    await FoundModel
      .findByIdAndUpdate(id, {
        claimed: true,
        claimerEmail: claimerEmail,
        claimerName: claimerName
      })
      .then((ele) => {
        console.log(ele);
        res.json({ saved: true, message: "Saved successfully" });
      });
  } catch (err) {
    console.log(err);
    res.json({ saved: false, message: err.toString() });
  }
};

exports.postfoundDetails = async (req, res) => {
  console.log(req.body);
  try {
    var {
      title,
      location,
      submittedat,
      description,
      imageString,
      email,
      username,
    } = req.body;
    const imageName = uuid.v4();
    const imagePath = path.resolve(
      __dirname + "/../" + "images_folder" + "/" + imageName + ".jpg"
    );
    console.log(imagePath);

    fs.writeFileSync(imagePath, Buffer.from(imageString, "base64"), (err) => {
      if (err) console.log(err);
      else {
        console.log("File written successfully\n");
      }
    });

    try {
      const metadata = await sharp(imagePath).metadata();
      console.log(metadata);
      // const photo_id = imageName;
      // const imageURL =
      //   "https://swc.iitg.ac.in/onestopapi/v2/getImage?photo_id=" + imageName;
      // const compressedImageURL =
      //   "https://swc.iitg.ac.in/onestopapi/v2/getCompressedImage?photo_id=" +
      //   imageName;
      const newImagePath = path.resolve(
        __dirname +
        "/../" +
        "images_folder" +
        "/" +
        imageName +
        "-compressed.jpg"
      );
      const compressedImagePath = path.resolve(
        __dirname +
        "/../" +
        "images_folder" +
        "/" +
        imageName +
        "-ultracompressed.jpg"
      );
      //const imageURL = "https://femefun.com/contents/videos_screenshots/50000/50719/preview.mp4.jpg";
      try {
        await sharp(imagePath)
          .resize({
            width: Math.floor(metadata.width / 2),
            height: Math.floor(metadata.height / 2),
          })
          .withMetadata()
          .toFormat("jpg", { mozjpeg: true })
          .toFile(newImagePath);
        await sharp(imagePath)
          .resize({
            width: Math.floor(
              metadata.width > 5 ? metadata.width / 5 : metadata.width
            ),
            height: Math.floor(
              metadata.height > 5 ? metadata.height / 5 : metadata.height
            ),
          })
          .withMetadata()
          .toFormat("jpg", { mozjpeg: true })
          .toFile(compressedImagePath);
        console.log("Here 1");
        console.log("Here 2");
        const newFoundDetail = await new FoundModel({
          title,
          location,
          submittedat,
          description,
          photo_id: imageName,
          // imageURL,
          // compressedImageURL,
          email,
          username,
        })
          .save()
          .then((result) => {
            console.log(result);
          });
        return res.json({ saved_successfully: true, image_safe: true });
      } catch (error) {
        return errorFxn(res, error);
      }
    } catch (error) {
      return errorFxn(res, error);
    }
  } catch (error) {
    return errorFxn(res, error);
  }
};

exports.updateFoundDetails = async (req,res) => {
  try{
    const id=req.query.id;
    let updateData = req.body;
    const foundItem = await FoundModel.findById(id);
    if (!foundItem) {
      res.json({
        deleted_successfully: false,
        "message": "looks something wrong"
      });
      return;
    }
    await FoundModel.findByIdAndUpdate(id,updateData);
    res.json({
      "updated_successfully": true
    });
  }
  catch (err){
    res.json({ "updated_successfully": false, "message": err.toString() });
  }
}

exports.postFoundRemoveDetails = async (req, res) => {
  try {
    const {
      id,
      email
    } = req.body;
    console.log(id, email);
    const foundItem = await FoundModel.findById(id);
    if (!foundItem) {
      res.json({
        deleted_successfully: false,
        "message": "looks something wrong"
      });
      return;
    }
    console.log(foundItem.email);
    if (foundItem.email == email) {
      await FoundModel.findByIdAndDelete(id);
      res.json({
        deleted_successfully: true
      });
    } else {
      res.json({
        message: "This item does not belong to the entered email"
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

exports.getMyAds = async (req, res) => {
  console.log(req.body);
  try {
    const {
      email
    } = req.body;
    console.log(email);

    const lostDetails = await LostModel.find({
      email: email
    });
    lostDetails.sort(compare);

    const foundDetails = await FoundModel.find({
      email: email
    });
    foundDetails.sort(compare);

    const allDetails = {
      foundList: foundDetails,
      lostList: lostDetails,
    };
    return res.json({
      details: allDetails
    });
  } catch (error) {
    console.log(error.message);
  }
};

exports.deleteFoundAll = async (req,res) => {
  await FoundModel.deleteMany({});
  res.json({success : true});
}

const compare = (a, b) => {
  return b.date - a.date;
};
