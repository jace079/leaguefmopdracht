const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// created by itsdevjace
let users = {}; 


let clients = [];

function broadcast() {
  const data = `data: update\n\n`;
  clients.forEach(res => res.write(data));
}

app.get('/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();
  clients.push(res);
  req.on('close', () => {
    clients = clients.filter(c => c !== res);
  });
});

app.get('/', (req, res) => {
  const currentUserId = req.cookies.userId;
  if (currentUserId && users[currentUserId]) {
    return res.redirect('/dashboard');
  }
  res.render('home', { users: Object.values(users) });
});

app.post('/create', (req, res) => {
  const name = (req.body.name || '').trim();
  if (name) {
    const id = crypto.randomUUID();
    users[id] = { id, name };
    res.cookie('userId', id);
    broadcast();
  }
  res.redirect('/');
});

app.post('/login/:id', (req, res) => {
  const id = req.params.id;
  if (users[id]) {
    res.cookie('userId', id);
  }
  res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
  const currentUserId = req.cookies.userId;
  const user = users[currentUserId];
  if (!user) {
    return res.redirect('/');
  }
  res.render('dashboard', { user });
});

app.post('/update-name', (req, res) => {
  const currentUserId = req.cookies.userId;
  const user = users[currentUserId];
  const name = (req.body.name || '').trim();
  if (user && name) {
    user.name = name;
    broadcast();
  }
  res.redirect('/dashboard');
});

app.post('/logout', (req, res) => {
  res.clearCookie('userId');
  res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` http://localhost:${PORT}`));
