const assert = require("power-assert");
const github = require("../lib/github.js")


it ("issues", function() {
  this.timeout(5000);

  return github.assignees('javamas', 'araignee')
      .then(data => {
        console.log(data);
        assert(data);
      })
})
