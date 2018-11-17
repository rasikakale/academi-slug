const mongoose = require('mongoose');
const { getClassID } = require('./course_json_parser');

mongoose.set('useFindAndModify', false); //Avoid deprecation warning
mongoose.connect('mongodb://jrybojad:exchangeslug3@ds135003.mlab.com:35003/academi-slug', {
    useNewUrlParser: true
});

const connection = mongoose.connection;
connection.once('open', function() {
    console.log('We\'re connected to the database!');
    if (process.env.NODE_ENV === 'buildTest') {
        setTimeout(() => {}, 3000);
    }
});
// connection.dropDatabase();

let classTutorSchema = new mongoose.Schema({
    _id: {
        type: Number,
        required: true,
        unique: true,
        alias: 'googleID'
    },
    name: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true
    },
}, {
    autoIndex: false,
    versionKey: false,
    _id: false
});

let classSchema = new mongoose.Schema({
    _id: {
        type: Number,
        required: true,
        unique: true,
        alias: 'courseNo'
    },
    tutors: [classTutorSchema]
}, {
    autoIndex: false,
    versionKey: false,
    _id: false
});


let Classes = mongoose.model('Classes', classSchema);

let courseTeachingSchema = new mongoose.Schema({
    _id: {
        type: Number,
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        default: 5
    },
}, {
    autoIndex: false,
    versionKey: false,
    _id: false
});

courseTeachingSchema.virtual('courseNo')
    .get(function() {
        return this._id;
    })
    .set(function(val) {
        this._id = val;
    });


let userSchema = new mongoose.Schema({
    _id: {
        type: Number,
        required: true,
        unique: true,
        alias: 'googleID'
    },
    email: {
        type: String,
        required: true
    },
    name: {
        first: {
            type: String,
            required: true,
            alias: 'firstName'
        },
        last: {
            type: String,
            required: true,
            alias: 'lastName'
        },
        _id: {
            id: false
        }
    },
    year: {
        type: String,
        required: true
    },
    college: {
        type: String,
        required: true
    },
    major: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        required: true
    },
    linkedIn: {
        type: String,
    },
    coursesTeaching: [courseTeachingSchema]
}, {
    autoIndex: false,
    versionKey: false,
    _id: false
});

userSchema.virtual('fullName').get(function() {
    return this.firstName + ' ' + this.lastName;
});


let Users = mongoose.model('Users', userSchema);

// //Uncomment to test
// //UpdateUser works on Reviews, but overrides reviews.
// deleteUser(24245)
//     .then(() => addUser({ googleID: 24245, email: 'sammyslub@ucsc.edu', firstName: 'Sammy', lastName: 'Slug', year: 'Junior', college: 'Nine', major: 'CS', bio: 'Banana Slug', coursesTeaching: [{ _id: 420, rating: 4 }, { _id: 567, rating: 2}], linkedIn: 'test URL' }))
//     .then(prof => findUser(prof.googleID))
//     .then(prof => {
//         console.log(`BEFORE: ${prof.fullName}`);
//         return prof;
//     })
//     .then((prof) => updateUser(prof.googleID, { 'name.first': 'Bob' }))
//     .then(prof => {
//         console.log(`AFTER: ${prof.fullName}`);
//         return prof;
//     })
//     //    .then((prof) => addReview(prof.googleID, { 'coursesTaught': [{_id:  420, rating: 4.6}] })) // Will break testing unit
//     .    catch(err => console.log(err));

function addUser (user) {
    return new Promise((resolve, reject) => {
        let userAdded = new Users({
            googleID: user.googleID,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            year: user.year,
            college: user.college,
            major: user.major,
            bio: user.bio,
            coursesTeaching: user.coursesTeaching,
            linkedIn: user.linkedIn

        });
        userAdded.save((err, profile) => {
            if (err) {
                return reject(err);
            }
            // console.log(profile);
            console.log('User ' + profile.googleID + ' added.');
            resolve(profile);
        });
    });
}

function deleteUser (googleID) {
    return new Promise((resolve, reject) => {
        Users.findByIdAndDelete(googleID, function(err) {
            if (err) {
                console.log('User with googleID ' + googleID + ' does not exist.');
                return reject(err);
            }
            console.log('User ' + googleID + ' deleted.');
            resolve();
        });
    });
}

function findUser (googleID) {
    console.log('Searching for User ' + googleID);
    return new Promise((resolve, reject) => {
        Users.findById(googleID)
            .exec((err, profile) => {
                if (err) {
                    return reject(err);
                }
                resolve(profile);
            });
    });
}

function updateUser (user, updates) {
    console.log('Updating user ' + user.id);
    return new Promise((resolve, reject) => {
        let keys = Object.keys(updates);
        let profileUpdate = {};
        if (keys.includes('coursesTeaching')) {
            for (const key in updates) {
                if (key !== 'coursesTeaching') {
                    profileUpdate[key] = updates[key];
                }
            }
        }
        let courses = updates.coursesTeaching || [];
        let delCourses = [];
        let newCourses = [];
        for (let i = 0; i < courses.length; i++) {
            let course = courses[i];
            if (course.includes('-')) {
                course = course.substring(1);
                delCourses.push({ _id: getClassID(course) });
                continue;
            }
            newCourses.push({ _id: getClassID(course) });
        }
        delCourses.forEach(course => {
            user.coursesTeaching.pull(course);
        });
        newCourses.forEach(course => {
            user.coursesTeaching.addToSet(course);
        });
        for (const field in updates) {
            if (field !== 'coursesTeaching') {
                const newResult = updates[field];
                user[field] = newResult;
            }
        }
        user.save(function(err) {
            if (err) return reject(err);
            resolve();
        });
    });
}

//Untested - needed
function addReview (googleID, courseNo, average) {
    console.log('Adding a review!');
    return new Promise((resolve, reject) => {
        Users.update({ 'googleID': googleID, 'courseNo': courseNo }, {
                $push: { 'courseNo.$.rating': average }
            })
            .exec((err, user) => {
                if (err) return reject(err);
                resolve(user);
            });
    });
}


/**
 * func should add tutor under class but if class is not in database
 * add class to db with tutor under it
 */
function addClass (courseNo) {
    return new Promise((resolve, reject) => {
        let classAdded = new Classes({ courseNo, tutors: [] });
        classAdded.save((err, course) => {
            if (err) {
                return reject(err);
            }
            console.log('Class ' + course.courseNo + ' added.');
            resolve(course);
        });
    });
}

function deleteClass (courseNo) {
    return new Promise((resolve, reject) => {
        Classes.findByIdAndDelete(courseNo, function(err) {
            if (err) {
                console.log('User with courseNo ' + courseNo + ' does not exist.');
                return reject(err);
            }
            console.log('Class ' + courseNo + ' deleted.');
            resolve();
        });
    });
}

//Seems to be working
//Should error checking when class does not exist
function addTutor (courseNo, tutor) {
    return new Promise((resolve, reject) => {

        Classes.findByIdAndUpdate(courseNo, { $push: { tutors: tutor } })
            .exec((err, user) => {
                if (err) return reject(err);
                console.log('Tutor ' + tutor._id + ' added to class ' + courseNo);
                resolve(user);
            });
    });
}

//Untested
function deleteTutor (googleID, courseNo) {
    return new Promise((resolve, reject) => {
        Classes.findByIdAndDelete(googleID, function(err) {
            if (err) {
                console.log('User with googleID ' + googleID + ' does not exist.');
                return reject(err);
            }
            console.log('Class ' + courseNo + ' deleted.');
            resolve();
        });
    });
}

// works, returns NULL if class is not found
function findClass (courseNo) {
    console.log('Searching for Class ' + courseNo);
    return new Promise((resolve, reject) => {
        console.log(courseNo)
        Classes.findById(courseNo)
            .exec((err, classQuery) => {
                if (err) {
                    return reject(err);

                }
                resolve(classQuery);
            });
    });
}

// //Uncomment to test
// deleteClass(456)
//     .then(() => addClass({ courseNo: 456}))
//     .then(() => addTutor(123, 456))
//     .then(() => addTutor(321, 456))
//     .then(prof => findUser(prof.googleID))
//     .then(prof => {
//         console.log(`BEFORE: ${prof.fullName}`);
//         return prof;
//     })
//     .then((prof) => updateUser(prof.googleID, { 'name.first': 'Bob' }))
//     .then(prof => {
//         console.log(`AFTER: ${prof.fullName}`);
//         return prof;
//     })
//     //    .then((prof) => addReview(prof.googleID, { 'coursesTaught': [{_id:  420, rating: 4.6}] })) // Will break testing unit
//     .    catch(err => console.log(err));
// addClass(21451)
//     .then(() => addTutor(21451, { _id: 4321, name: 'Sammy Slug', rating: 4 }))
//     .then(() => addTutor(21451, { _id: 5555, name: 'George Bluementhall', rating: 3 }));

module.exports = {
    addUser,
    deleteUser,
    findUser,
    updateUser,
    addClass,
    addTutor,
    findClass,
    connection
};