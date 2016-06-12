const COLOR = {
  "primary": "#428bca",
  "success": "#5cb85c",
  "info": "#5bc0de",
  "warning": "#f0ad4e",
  "danger": "#d9534f",
  "get": num => {
    if (num === 0) return COLOR.primary;
    if (num > 0 && num <= 2) return COLOR.success;
    if (num > 2 && num <= 4) return COLOR.warning;
    if (num > 4) return COLOR.danger;
  }
}

exports.COLOR = COLOR
