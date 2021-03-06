var chai = require('chai');
chai.use(require('chai-as-promised'));

// Specifies assertion libraries
chai.should();
var expect = require('chai').expect;
const database = require('../webApp/server_modules/mongoose');

// Defines a sample input
let testUser = new database.Users({
    googleID: Math.random(),
    email: 'testUser@gmail.com',
    firstName: 'Test',
    lastName: 'User',
    year: 'Sophoomre',
    college: 'Kresge',
    major: 'Computer Science',
    bio: 'I like to teach!', 
    linkedIn: 'test URL',
    coursesTeaching: [{ _id: 420, rating: 4 }, { _id: 567, rating: 2 }]
});

// Before each execution, deletes any spare testUser documents
before(() => {
    database.Users.deleteMany({ email: 'testUser@gmail.com' }, function(err) {
        console.log(err);
    });
});

// Tests all functions of UserSchema
describe('user', () => {
    describe('#save()', () => {
        it('should save without error', done => {
            testUser.save(err  => {
                if (err) done(err);
                else done();
            });
        });

        it('should save correct document into database', done => {
            database.Users.findById(testUser.googleID, (err,thisUser) => {
                    JSON.stringify(thisUser).should.equal(JSON.stringify(testUser));
                    done();
                });
        });

        it('should not save two Users with the same googleID', done => {
            new Promise(() => {
                return new Promise(testUser.save(() => {testUser.save();}));
            }).should.be.rejected.notify(done);
        });
    });

    describe('#findById()', () => {
        it('should find user by googleID without error', done => {
            database.Users.findById(testUser.googleID);
            done();
        });

        it('should find the correct user given a googleID', done => {
            database.Users.findById(testUser.googleID, (err, user) => {
                JSON.stringify(user).should.equal(JSON.stringify(testUser));
                done();
            });
        });

        it('should return null on invalid googleID', done => {
            let nonGoogleID = Math.random();
            while (nonGoogleID == testUser.googleID)
                nonGoogleID = Math.random();

            database.Users.findById(nonGoogleID, (err,user) => {
                expect(user).to.be.null;
                done();
            });
        });
    });

    describe('#delete()', () => {
        it('should delete without error', done => {
            database.Users.deleteOne(testUser, () =>{
                done();
            });
        });

        it('user deleted should not be in database', done => {
            database.Users.findById(testUser.googleID, (err, user) => {
                expect(user).to.be.null;
                done();
            });
        });
    });

    describe('#addUser()', () => {
        it('should add user without error', done => {
            database.addUser(testUser);
            done();
        });

        it('should add correct user into database', done => {
            database.Users.findById(testUser.googleID, (err,thisUser) => {
                JSON.stringify(thisUser).should.equal(JSON.stringify(testUser));
                done();
            });
        });

        it('should not add two Users with the same googleID', done => {
            new Promise(() => {
                return new Promise(database.addUser(testUser));
            }).should.be.rejected.notify(done);
        });
    });

    describe('#findUser()', () => {
        it('should find user without error', done => {
            database.findUser(testUser.googleID);
            done();
        });

        // Can ignore duplicate key error index
        it('should find the correct user given a googleID', done => {
            database.findUser(testUser.googleID)
                .then(user => {
                    JSON.stringify(user).should.equal(JSON.stringify(testUser));
                    done();
                });
        });

        it('should return null on invalid googleID', done => {
            let nonGoogleID = Math.random();
            while (nonGoogleID == testUser.googleID)
                nonGoogleID = Math.random();

            database.findUser(nonGoogleID)
                .then(user => {
                    expect(user).to.be.null;
                    done();
                });
        });
    });

    describe('#deleteUser()', () => {
        it('should delete user without error', done => {
            database.deleteUser(testUser.googleID);
            done();
        });

        it('user deleted should not be in database', done => {
            database.findUser(testUser.googleID)
                .then(user => {
                    expect(user).to.be.null;
                    done();
                });
        });
    });


    describe('#updateUser()', () => {
        updates = testUser.bio = 'I hate to teach';

        it('should update user', () => {
           database.updateUser(testUser.googleID, updates)
           .then(user => {
                expect(user.bio).to.be('I hate to teach');
                done();
           });
            });
        });
});

// Tests all functions of ClassSchema
describe('class', () => {
        describe('#addClass()', () => {
            it('should add a class', () => {
                return database.addClass._id;
            });
        });

        describe('#deleteClass()', () => {
            it('should delete a class', () => {
                return database.deleteClass._id;
            });
        });

        describe('#addReview()', () => {
            reviews = [2, 3, 4, 5];
            it('should add a review', () => {
                database.addReview(testUser.googleID, database.findClass(420), reviews)
                    .then(user => {
                        expect(user.findClass(420).rating).to.be(3.75);
                        done();
                    });
            });
        });


        describe('#deleteTutor()', () => {
            it('should delete a tutor', () => {
                return database.deleteTutor(testUser.googleID, testUser.coursesTeaching._id);
            });

            it('should set invalid googleID to null', () => {
                let nonGoogleID = Math.random();
                while (nonGoogleID == testUser.googleID)
                    nonGoogleID = Math.random();

                database.findUser(nonGoogleID)
                    .then(profile => {
                        return expect(profile).to.be.null;
                    });
            });
        });

        //having trouble testing this method
        describe('#findClass()', () => {
            it('should find a class', () => {
                return database.Classes.findById(testUser._id);
            });
        });
});