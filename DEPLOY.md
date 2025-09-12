# Документация по деплою фронтенда

## Обзор проекта

Современный фронтенд для менеджера заданий, построенный на Vite + TailwindCSS + Vanilla JS.

## Подготовка к деплою

### 1. Сборка проекта

```bash
# Установка зависимостей
npm install

# Сборка для продакшена
npm run build
```

После сборки файлы будут находиться в папке `dist/`.

### 2. Структура файлов после сборки

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── favicon.ico (если есть)
```

## Варианты деплоя

### Вариант 1: Nginx (Рекомендуется)

#### 1. Установка Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
# или
sudo dnf install nginx
```

#### 2. Конфигурация Nginx

Создайте файл `/etc/nginx/sites-available/task-manager`:

```nginx
server {
    listen 3012;
    server_name your-domain.com;  # замените на ваш домен или IP
    
    root /var/www/task-manager;
    index index.html;
    
    # Основная конфигурация
    location / {
        try_files $uri $uri/ /index.html;
        
        # Кэширование статических файлов
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Проксирование API запросов к бэкенду
    location /api/ {
        proxy_pass http://10.171.12.36:3005/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS заголовки
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
        
        # Обработка preflight запросов
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain charset=UTF-8';
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

#### 3. Активация конфигурации

```bash
# Создание символической ссылки
sudo ln -s /etc/nginx/sites-available/task-manager /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации (если нужно)
sudo rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx
```

#### 4. Размещение файлов

```bash
# Создание директории
sudo mkdir -p /var/www/task-manager

# Копирование файлов из dist/
sudo cp -r dist/* /var/www/task-manager/

# Установка прав доступа
sudo chown -R www-data:www-data /var/www/task-manager
sudo chmod -R 755 /var/www/task-manager
```

### Вариант 2: Apache

#### 1. Установка Apache

```bash
# Ubuntu/Debian
sudo apt install apache2

# CentOS/RHEL
sudo yum install httpd
```

#### 2. Конфигурация Apache

Создайте файл `/etc/apache2/sites-available/task-manager.conf`:

```apache
<VirtualHost *:3012>
    ServerName your-domain.com
    DocumentRoot /var/www/task-manager
    
    # Основная конфигурация
    <Directory /var/www/task-manager>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        # SPA routing
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Проксирование API
    ProxyPreserveHost On
    ProxyPass /api/ http://10.171.12.36:3005/
    ProxyPassReverse /api/ http://10.171.12.36:3005/
    
    # CORS заголовки
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
    
    # Кэширование
    <LocationMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </LocationMatch>
</VirtualHost>
```

#### 3. Активация

```bash
# Включение модулей
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers

# Активация сайта
sudo a2ensite task-manager

# Перезапуск Apache
sudo systemctl restart apache2
```

### Вариант 3: Простой HTTP сервер (для тестирования)

```bash
# Установка простого HTTP сервера
npm install -g http-server

# Запуск на порту 3012
cd dist
http-server -p 3012 -c-1
```

## Настройка файрвола

### UFW (Ubuntu)

```bash
# Разрешение порта 3012
sudo ufw allow 3012

# Проверка статуса
sudo ufw status
```

### FirewallD (CentOS/RHEL)

```bash
# Разрешение порта 3012
sudo firewall-cmd --permanent --add-port=3012/tcp
sudo firewall-cmd --reload

# Проверка
sudo firewall-cmd --list-ports
```

## SSL сертификат (опционально)

### Let's Encrypt с Certbot

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com

# Автообновление
sudo crontab -e
# Добавить: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Мониторинг и логи

### Nginx логи

```bash
# Основные логи
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Логи конкретного сайта
sudo tail -f /var/log/nginx/task-manager.access.log
sudo tail -f /var/log/nginx/task-manager.error.log
```

### Мониторинг процесса

```bash
# Статус Nginx
sudo systemctl status nginx

# Перезапуск при необходимости
sudo systemctl restart nginx
```

## Обновление приложения

```bash
# 1. Сборка новой версии
npm run build

# 2. Копирование файлов
sudo cp -r dist/* /var/www/task-manager/

# 3. Установка прав
sudo chown -R www-data:www-data /var/www/task-manager

# 4. Перезапуск веб-сервера (если нужно)
sudo systemctl reload nginx
```

## Проверка деплоя

1. **Откройте браузер** и перейдите на `http://your-server-ip:3012`
2. **Проверьте консоль браузера** на наличие ошибок
3. **Протестируйте функциональность**:
   - Загрузка списка заданий
   - Поиск и фильтрация
   - Загрузка файлов
   - Скачивание Excel файлов

## Возможные проблемы

### CORS ошибки
- Убедитесь, что в конфигурации веб-сервера правильно настроены CORS заголовки
- Проверьте, что API запросы проксируются корректно

### 404 ошибки при обновлении страницы
- Убедитесь, что настроен fallback на `index.html` для SPA

### Проблемы с правами доступа
```bash
sudo chown -R www-data:www-data /var/www/task-manager
sudo chmod -R 755 /var/www/task-manager
```

### Порт 3012 занят
```bash
# Проверка занятых портов
sudo netstat -tulpn | grep :3012

# Остановка процесса (если нужно)
sudo kill -9 PID
```

## Автоматизация деплоя

### Скрипт деплоя

Создайте файл `deploy.sh`:

```bash
#!/bin/bash
echo "Building project..."
npm run build

echo "Copying files to server..."
sudo cp -r dist/* /var/www/task-manager/

echo "Setting permissions..."
sudo chown -R www-data:www-data /var/www/task-manager

echo "Reloading nginx..."
sudo systemctl reload nginx

echo "Deployment completed!"
```

Сделайте скрипт исполняемым:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Заключение

После выполнения этих шагов ваш фронтенд будет доступен по адресу `http://your-server-ip:3012` и готов к использованию.
