#!/usr/bin/env node
'use strict';
const request = require('request'),
  parseArgs = require('minimist'),
  querystring = require('querystring');

const argv = parseArgs(process.argv.slice(2), {
  alias: {
    'level': 'l',
    'lessons': ['lesson', 's'],
    'topic': 't',
    'dryRun': 'd',
  },
  boolean: ['dryRun', 'help'],
  default: {
    'level': 'A1',
  },
});

/*----*/

if(argv.help || !argv.topic) {
  printUsage();
} else {
  const action = argv.dryRun ? dryRun : pullWords;
  action();
}

/*----*/

function pullWords () {
  getWords(argv).then(res => {
    const lines = res.DATA.map(entry => formatEntry(entry));
    console.log(lines.join('\n'));
  }).catch(e => console.error(e));
}

function dryRun () {
  console.log(generateUrl(argv));
}

function printUsage () {
  console.log(`
Usage: marugoto-pull -t n > output.txt
Arguments: 
  --topic   -t    Set the topic number to request. (required)
  --level   -l    Set the vocabulary proficiency level. (default: A1)
  --lessons -s    Set the vocabulary proficiency level.
  --dryRun  -d    Do not request anything, just print the URL.
`);
}

/*----*/

function formatEntry (entry) {
  const fieldNames = ['KANA', 'KANJI', 'ROMAJI', 'UWRD'];
  return fieldNames.map(name => entry[name]).join(';');
}

function getWords (options) {
  const deferred = Promise.defer();
  request(generateUrl(options), function (err, res, body) {
    if(!err && res.statusCode === 200) {
      deferred.resolve(body);
    } else {
      deferred.reject(err || new Error(`Request failed. (status: ${res.statusCode})`));
    }
  }); 
  return deferred.promise.then(res => JSON.parse(res));
}

function generateUrl (options) {
  const baseUrl = 'http://words.marugotoweb.jp/SearchCategoryAPI';
  const params = {
    p: 1, //Page
    m: 100000, //Results per page
    tx: 'vocab', //Relevant book type
    ut: 'en', //Translation language
    tp: options.topic,
    lv: options.level,
  };
  if(options.lessons) {
    params.ls = options.lessons;
  }
  return baseUrl + '?' + querystring.stringify(params);
}
