const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: '.' }),
  secret: process.env.SESSION_SECRET || 'troque_isto_em_producao',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Informe usuário e senha' });

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(409).json({ error: 'Usuário já existe' });

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?,?)');
  const info = stmt.run(username, hash);

  req.session.userId = info.lastInsertRowid;
  res.json({ ok: true, id: info.lastInsertRowid });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Informe usuário e senha' });

  const row = db.prepare('SELECT id, password_hash FROM users WHERE username = ?').get(username);
  if (!row) return res.status(401).json({ error: 'Credenciais inválidas' });

  const match = bcrypt.compareSync(password, row.password_hash);
  if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });

  req.session.userId = row.id;
  res.json({ ok: true });
});

app.get('/api/profile', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autenticado' });

  const user = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?').get(req.session.userId);
  res.json({ user });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Erro ao sair' });
    res.json({ ok: true });
  });
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));