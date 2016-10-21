var request = require('request');
var sentiment = require('sentiment');
var MOODS = {"neutral":"neutral","positive":"positive","negative":"negative"};
module.exports = function(personality,subscriptionKey) {
    this.getDialogs = function (message, dialogs) {
        return new Promise((resolve, reject)=> {
            var score = sentiment(message || '').score;
            var mood = MOODS.neutral;
            if (score > 0) {
                mood = MOODS.positive;
            } else if (score < 0) {
                mood = MOODS.negative;
            }
            var found = dialogs.filter(x=>x.mood == mood);
            if (!found.length) {
                found = dialogs.filter(x=>x.mood == MOODS.neutral);
            }
            if (!found.length) {
                return reject(new Error(`Dialogs not found for ${MOODS.neutral} mood`));
            }
            resolve(found.map(x=>x.dialog));
        });
    }
}