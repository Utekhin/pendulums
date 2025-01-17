const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8000;

// Указываем папку для статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// Обслуживаем главный файл index.html по любому запросу
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});