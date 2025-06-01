  const examples = {
    'basic': `<!DOCTYPE html>
<html>
  <head>
    <title>Basic Page</title>
  </head>
  <body>
    <h1>Hello World</h1>
    <p>This is a basic HTML page.</p>
  </body>
</html>`,
    'form': `<!DOCTYPE html>
<html>
<head>
  <title>Form Example</title>
  <style>
    form {
      max-width: 500px;
      margin: 20px auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 5px;
    }

    label {
      display: block;
      margin-bottom: 5px;
    }

    input,
    textarea {
      width: 100%;
      padding: 8px;
      margin-bottom: 10px;
    }

    button {
      background: #007acc;
      color: white;
      border: none;
      padding: 10px 15px;
    }

  </style>
</head>
<body>
  <form>
    <label>Name:</label>
    <input type="text">
    <label>Email:</label>
    <input type="email">
    <label>Message:</label>
    <textarea rows="4"></textarea>
    <button type="submit">Submit</button>
  </form>
</body>
</html>`,
    'grid': `<!DOCTYPE html>
<html>
<head>
  <title>CSS Grid</title>
  <style>
    .grid-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .grid-item {
      background: #007acc;
      color: white;
      padding: 20px;
      text-align: center;
    }

  </style>
</head>
<body>
  <div class="grid-container">
    <div class="grid-item">1</div>
    <div class="grid-item">2</div>
    <div class="grid-item">3</div>
    <div class="grid-item">4</div>
    <div class="grid-item">5</div>
    <div class="grid-item">6</div>
  </div>
</body>
</html>`,
    'table': `<!DOCTYPE html>
<html>
<head>
  <title>Table Example</title>
  <style>
    table {
      border-collapse: collapse;
      width: 100%;
    }

    th,
    td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }

    th {
      background-color: #007acc;
      color: white;
    }

    tr:nth-child(even) {
      background-color: #f2f2f2;
    }

  </style>
</head>
<body>
  <table>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Role</th>
    </tr>
    <tr>
      <td>Blue</td>
      <td>Blue@amongus.sussy</td>
      <td>Crew mate</td>
    </tr>
    <tr>
      <td>Red</td>
      <td>Red@amongus.sussy</td>
      <td>Imposter</td>
    </tr>
  </table>
</body>
</html>`,
    'responsive': `<!DOCTYPE html>
<html>
<head>
  <title>Responsive Example</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      background: #007acc;
      color: white;
      padding: 20px;
      text-align: center;
    }

    .main {
      display: flex;
      flex-wrap: wrap;
    }

    .sidebar {
      flex: 1;
      min-width: 200px;
      background: #f0f0f0;
      padding: 20px;
    }

    .content {
      flex: 3;
      min-width: 300px;
      padding: 20px;
    }

    @media (max-width: 600px) {
      .main {
        flex-direction: column;
      }

    }

  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Responsive Layout</h1>
    </div>
    <div class="main">
      <div class="sidebar">
        <h3>Sidebar</h3>
        <p>Content here</p>
      </div>
      <div class="content">
        <h2>Main Content</h2>
        <p>Resize the browser to see the responsive effect.</p>
      </div>
    </div>
  </div>
</body>
</html>`,
    'json-example': `{
  "name": "My Project",
  "version": "1.0.0",
  "description": "A sample JSON file",
  "dependencies": {
    "monaco-editor": "^0.40.0",
    "jszip": "^3.10.1"
  },
  "scripts": {
    "start": "node server.js",
    "build": "webpack"
  }
}`
  };