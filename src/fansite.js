const App = require('./miniWeb.js').App;
const app = new App();
const images = ['image1.jpg','image2.png','image3.gif','image4.gif','image5.gif', 'bmo1.gif', 'background.jpg'];

app.get('/', function(req, res){
  res.sendFile('/html/index.html');
});

app.get('/about', function(req, res){
  res.sendFile('/html/about.html');
});

app.get('/css/base.css', function(req, res){
  res.sendFile('/css/base.css');
});

app.get('/rando', function(req, res){
  res.sendFile('/html/random.html');
});

app.get('/randomGif', function(req, res){
  res.redirect(303, '/'+images[Math.floor(Math.random() * 5)]);
});

app.get('/home', function(req, res){
  res.redirect(301, '/');
});

images.forEach((x) => {app.get(('/'+x), function(req, res){res.sendFile('/img/'+x);})});

app.listen(8080, '127.0.0.1');
