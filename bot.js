const Botkit = require('botkit');
const amqp = require('amqplib/callback_api');

const BOT_NAME = 'chappie';
const commands = {
  'help': ['help'],
  'greet': ['hello','hi','greet'],
  'profile': ['profile'],
  'mq': ['mq'],
  'araignee': ['araignee', 'あれにえ', 'アレニエ'],
  'manipulate': ['manipulate']
}

if (!process.env.token) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

const controller = Botkit.slackbot({
 debug: false
});

controller.spawn({
  token: process.env.token
}).startRTM((err) => {
  if (err) {
    throw new Error(err);
  }
});

controller.hears(commands.help,['direct_message','direct_mention','mention'], (bot,message) => {
    const usage = [`${BOT_NAME}のできること`];
    usage.push(`\`@${BOT_NAME} ${commands.help}\`: できること`)
    usage.push(`\`@${BOT_NAME} ${commands.greet}\`: あいさつ`)
    usage.push(`\`@${BOT_NAME} ${commands.profile}\`: ${BOT_NAME}を詳しく知る`)
    usage.push(`\`@${BOT_NAME} ${commands.mq}\`: メッセージキューを使う`)
    usage.push(`\`@${BOT_NAME} ${commands.araignee}\`: araigneeする`)
    usage.push(`\`@${BOT_NAME} ${commands.manipulate}\`: ${BOT_NAME}を操る:skull:`)
    bot.reply(message, usage.join('\n'));
});

controller.hears(commands.greet,['direct_message','direct_mention','mention'], (bot,message) => {
    bot.reply(message,"Bow-wow!");
});

controller.hears(commands.profile,['direct_message','direct_mention','mention'], (bot,message) => {
    bot.startConversation(message, function(err, convo) {
        const questions = {
          'q': 'ぼくの何が知りたい？',
          'commands': {
              'info': 'ぼくは誰？',
              'house': 'すんでいるところの情報',
              'more': 'さらに詳しく'
          }
        }
        const q = [questions.q].concat(Object.keys(questions.commands).map(cmd => `\`${cmd}\`: ${questions.commands[cmd]}`)).join('\n');
        convo.ask(q, [
            {
                pattern: 'info',
                callback: function(response,convo) {
                    convo.say(`ぼくはチャウチャウの${BOT_NAME} :sparkles:`);
                    convo.say('https://ja.wikipedia.org/wiki/%E3%83%81%E3%83%A3%E3%82%A6%E3%83%BB%E3%83%81%E3%83%A3%E3%82%A6');
                    convo.say('みんなのサポートをするからぼくにも話しかけてね :notes:');
                    convo.next();
                }
            },
            {
                pattern: 'house',
                callback: function(response,convo) {
                    convo.say('ぼくの住んでいるところの情報だよ:house:');
                    const env = JSON.stringify(process.env, null , '\t');
                    convo.say(`\`\`\`\n${env}\n\`\`\``);
                    convo.next();
                }
            },
            {
                pattern: 'more',
                callback: function(response,convo) {
                    convo.say('ここをみてね :eyes:');
                    convo.say('https://github.com/javamas/chappie');
                    convo.next();
                }
            },
            {
                default: true,
                callback: function(response,convo) {
                    convo.repeat();
                    convo.next();
                }
            }
        ]);
    });
});

controller.hears(commands.mq,['direct_message','direct_mention','mention'], (bot,message) => {
    bot.startConversation(message, function(err, convo) {
        const host = process.env.MQ_HOST;
        const user = process.env.MQ_USER;
        const password = process.env.MQ_PASSWORD;
        const questions = {
          'q': '何をする？',
          'commands': {
              'help': 'メッセージキューについての説明',
              'info': 'メッセージキューの情報',
              'test': 'メッセージキューの接続テスト',
              'login': '管理画面にログイン'
          }
        }
        const q = [questions.q].concat(Object.keys(questions.commands).map(cmd => `\`${cmd}\`: ${questions.commands[cmd]}`)).join('\n');
        convo.ask(q, [
            {
                pattern: 'help',
                callback: function(response,convo) {
                    convo.say('ここをみてね :eyes:');
                    convo.say('https://gist.github.com/disc99/e46b0a76cd3285f9142776a15ce578bf');
                    convo.next();
                }
            },
            {
                pattern: 'info',
                callback: function(response,convo) {
                    convo.say('メッセージキューの情報だよ :mailbox:');
                    convo.say(`\`\`\`\nHost: ${host}\nUser: ${user}\nPassword: ${password}\n\`\`\``);
                    convo.next();
                }
            },
            {
                pattern: 'test',
                callback: function(response,convo) {
                    amqp.connect(`amqp://${user}:${password}@${host}/${user}`, function(err, conn) {
                        if (err) {
                            convo.say('何か様子がおかしいみたいだ...');
                            convo.say(`\`\`\`\n${err}\n\`\`\``);
                        } else {
                            convo.say('上手く接続できたよ！:sparkles:');
                            conn.close();
                        }
                        convo.next();
                    });
                }
            },
            {
                pattern: 'login',
                callback: function(response,convo) {
                    convo.say('ここからログインしてね:door:');
                    convo.say(`https://${host}/`);
                    convo.next();
                }
            },
            {
                default: true,
                callback: function(response,convo) {
                    convo.repeat();
                    convo.next();
                }
            }
        ]);
    });
});

controller.hears(commands.manipulate, ['direct_message','direct_mention','mention'], (bot,message) => {
    bot.startConversation(message, function(err, convo) {
        convo.ask("実行するコマンドは？", function(response, convo) {
            const code = response.text;
            convo.ask(`実行してもいい？\n\`\`\`\n${code}\n\`\`\``, [
                {
                    pattern: bot.utterances.yes,
                    callback: function(response,convo) {
                        convo.say('実行結果は...');
                        try {
                            convo.say(`\`\`\`\n${eval(code)}\n\`\`\``)
                        } catch (e) {
                            convo.say(`\`\`\`\n${e}\n\`\`\``)
                        }
                        convo.next();
                    }
                },
                {
                    pattern: bot.utterances.no,
                    callback: function(response,convo) {
                        convo.say('おっけー');
                        convo.next();
                    }
                },
                {
                    default: true,
                    callback: function(response,convo) {
                        convo.repeat();
                        convo.next();
                    }
                }
            ]);
            convo.next();
        });
    });
});

controller.hears(commands.araignee, ['direct_message','direct_mention','mention'], (bot,message) => {
    bot.startConversation(message, function(err, convo) {
        const host = process.env.MQ_HOST;
        const user = process.env.MQ_USER;
        const password = process.env.MQ_PASSWORD;
        convo.ask('対象ページを教えて！', [
            {
                pattern: /https?:\/\/.+$/,
                callback: function(response,convo) {
                    amqp.connect(`amqp://${user}:${password}@${host}/${user}`, function(err, conn) {
                        if (err) {
                            convo.say('うまく送れなかった...');
                            convo.say(`\`\`\`\n${err}\n\`\`\``);
                        } else {
                            conn.createChannel(function(err, ch) {
                                var ex = 'pages';
                                ch.assertExchange(ex, 'fanout', {durable: false});
                                const url = response.text.substr(1, (response.text.length-2))
                                ch.publish(ex, '', new Buffer(url));
                                console.log(" [x] Sent %s", url);
                                convo.say('URLを送ったよ！');
                            });
                            setTimeout(() => conn.close(), 500);
                        }
                        convo.next();
                    });
                }
            },
            {
                default: true,
                callback: function(response,convo) {
                    convo.repeat();
                    convo.next();
                }
            }
        ]);
    });
});
