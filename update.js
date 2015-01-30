var fs = require('fs');
var _ = require('lodash');
var GoogleSpreadsheet  = require('google-spreadsheet');

var settings = require('./settings.json');

var sheet = new GoogleSpreadsheet(settings.key);

sheet.setAuth(settings.user, settings.pass, function(err){

    if(err) {
        console.log(err);
    } else {

        // read the first sheet in the document
        sheet.getRows( 1, function(err, rows){

            if(err) {
                console.log(err);
            } else {

                var i, len, langId;
                var refKey = settings.refKey;
                var langList = settings.langList;
                var langLength = langList.length;
                var langData = {};

                // create a list of language data objects
                for(i = 0; i < langLength; i++) {
                    langData[langList[i]] = {};
                }

                var row, str;
                for(i = 0, len = rows.length; i < len; i++) {
                    row = rows[i];
                    if(row[refKey]) {
                        for(j = 0; j < langLength; j++) {
                            langId = langList[j];
                            str = row[langId];
                            if(!str) {
                                // not localized
                                str = row[refKey];
                            }

                            // I want to remove the line breaks in the data as I will just use <br> for line-break
                            langData[langId][row[refKey]] = str.replace(/(\r\n|\n|\r)/gm, '');
                        }
                    }
                }

                // LANG_LIST
                var LANG_LIST = [];
                var data;
                for(i = 0; i < langLength; i++) {
                    data = langData[langList[i]];
                    LANG_LIST.push({
                        id: data.langId,
                        name: data.langName
                    });
                }

                var src = fs.readFileSync(settings.srcFile).toString();
                var tmpl = _.template(src);
                var json;
                for(i = 0; i < langLength; i++) {
                    lang = langList[i];
                    data = langData[lang];

                    // inject some custom properties into the data
                    data.LANG = lang;
                    data.LANG_LIST = LANG_LIST;

                    fs.writeFileSync(settings.dist + lang + '.' + settings.ext, tmpl(data));
                    console.log(lang + ' is generated');
                }
            }
        });
    }
});
