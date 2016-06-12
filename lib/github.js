const GitHub = require('github-api');
const moment = require('moment');
const slacks = require("../lib/slacks.js")

exports.assignees = (user, repo) => {
  return issues(user, repo)
    .then(toMilestoneGroup)
    .then(toMessage);
}

function issues(user, repo) {
  return new Promise((resolve, reject) => {
    new GitHub({token: process.env.GITHUB_TOKEN})
        .getIssues(user, repo)
        .listIssues({}, (error, result) => error ? reject(error) : resolve(result));
  });
}

function toMilestoneGroup(issues) {
  return new Promise(function(resolve, reject) {
    return resolve(issues
       .filter(i => i.milestone)
       .filter(i => i.milestone.state === 'open')
       .filter(i => moment().startOf('day').isSameOrBefore(i.milestone.due_on))
       .sort((i1, i2) => i1.number - i2.number)
         .reduce((is, i) => {
           const msNumber = i.milestone.number;
           const msAssignee = i.assignee ? '@'+i.assignee.login : 'No one';
           is[msNumber] = is[msNumber] || [];
           is[msNumber][msAssignee] = is[msNumber][msAssignee] || [];
           is[msNumber][msAssignee].push(i);
           return is;
       }, {}));
  });
}

function toMessage(milestoneGroup) {
  return Object.keys(milestoneGroup).reduce((msAcc, msNumber) => {
      const milestone = milestoneGroup[msNumber][Object.keys(milestoneGroup[msNumber])[0]][0].milestone;
      msAcc.push({
        'color': slacks.COLOR.info,
        'title': `Milestone: ${milestone.title}`,
        'title_link': milestone.html_url,
        'fields': [{
            'title': 'Priority',
            'value': `${moment(milestone.created_at).format('YYYY/MM/DD(ddd)')} 〜 ${moment(milestone.due_on).format('YYYY/MM/DD(ddd)')}`,
            'short': true
        }]
      });

      Object.keys(milestoneGroup[msNumber]).reduce((assigneeAcc, msAssignee) => {
          const assignee = milestoneGroup[msNumber][msAssignee];
          const assigneeMsg = {
              "color": slacks.COLOR.get(assignee.length),
              "title": `All ${assignee.length} issues`,
              "title_link": msAssignee.startsWith("@") ? `https://github.com/javamas/araignee#boards?assignee=${msAssignee.substring(1)}` : "",
              "author_name" : msAssignee,
              "fields": assignee.map(i => {
                return {
                  'value': `<${i.html_url}|#${i.number} ${i.title}>`
                }
              })
          }

          msAcc.push(assigneeMsg);
      }, []);

      return msAcc;
  }, []);
}
