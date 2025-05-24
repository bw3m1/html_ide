const examples = {
    'basic': `<!DOCTYPE html>\n<html>\n<head>\n  <title>Basic Page</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n  <p>This is a basic HTML page.</p>\n</body>\n</html>`,
    'form': `<!DOCTYPE html>\n<html>\n<head>\n  <title>Form Example</title>\n  <style>\n    form {\n      max-width: 500px;\n      margin: 20px auto;\n      padding: 20px;\n      border: 1px solid #ddd;\n      border-radius: 5px;\n    }\n    label { display: block; margin-bottom: 5px; }\n    input, textarea { width: 100%; padding: 8px; margin-bottom: 10px; }\n    button { background: #007acc; color: white; border: none; padding: 10px 15px; }\n  </style>\n</head>\n<body>\n  <form>\n    <label>Name:</label>\n    <input type="text">\n    <label>Email:</label>\n    <input type="email">\n    <label>Message:</label>\n    <textarea rows="4"></textarea>\n    <button type="submit">Submit</button>\n  </form>\n</body>\n</html>`,
    'grid': `<!DOCTYPE html>\n<html>\n<head>\n  <title>CSS Grid</title>\n  <style>\n    .grid-container {\n      display: grid;\n      grid-template-columns: repeat(3, 1fr);\n      gap: 10px;\n    }\n    .grid-item {\n      background: #007acc;\n      color: white;\n      padding: 20px;\n      text-align: center;\n    }\n  </style>\n</head>\n<body>\n  <div class="grid-container">\n    <div class="grid-item">1</div>\n    <div class="grid-item">2</div>\n    <div class="grid-item">3</div>\n    <div class="grid-item">4</div>\n    <div class="grid-item">5</div>\n    <div class="grid-item">6</div>\n  </div>\n</body>\n</html>`,
    'table': `<!DOCTYPE html>\n<html>\n<head>\n  <title>Table Example</title>\n  <style>\n    table { border-collapse: collapse; width: 100%; }\n    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n    th { background-color: #007acc; color: white; }\n    tr:nth-child(even) { background-color: #f2f2f2; }\n  </style>\n</head>\n<body>\n  <table>\n    <tr>\n      <th>Name</th>\n      <th>Email</th>\n      <th>Role</th>\n    </tr>\n    <tr>\n      <td>Blue</td>\n      <td>Blue@amongus.sussy</td>\n      <td>Crew mate</td>\n    </tr>\n    <tr>\n      <td>Red</td>\n      <td>Red@amongus.sussy</td>\n      <td>Imposter</td>\n    </tr>\n  </table>\n</body>\n</html>`,
    'responsive': `<!DOCTYPE html>\n<html>\n<head>\n  <title>Responsive Example</title>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }\n    .header { background: #007acc; color: white; padding: 20px; text-align: center; }\n    .main { display: flex; flex-wrap: wrap; }\n    .sidebar { flex: 1; min-width: 200px; background: #f0f0f0; padding: 20px; }\n    .content { flex: 3; min-width: 300px; padding: 20px; }\n    @media (max-width: 600px) {\n      .main { flex-direction: column; }\n    }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>Responsive Layout</h1>\n    </div>\n    <div class="main">\n      <div class="sidebar">\n        <h3>Sidebar</h3>\n        <p>Content here</p>\n      </div>\n      <div class="content">\n        <h2>Main Content</h2>\n        <p>Resize the browser to see the responsive effect.</p>\n      </div>\n    </div>\n  </div>\n</body>\n</html>`,
    'json-example': `{\n  "name": "My Project",\n  "version": "1.0.0",\n  "description": "A sample JSON file",\n  "dependencies": {\n    "monaco-editor": "^0.40.0",\n    "jszip": "^3.10.1"\n  },\n  "scripts": {\n    "start": "node server.js",\n    "build": "webpack"\n  }\n}`
  };

export function loadExample(exampleName) {
  if (examples[exampleName]) {
    return examples[exampleName];
  } else {
    throw new Error(`Example "${exampleName}" not found.`);
  }
}

export {
  loadExample
}