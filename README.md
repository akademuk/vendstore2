# VendStore

Окремий лендинг smart-вендінгу (Helper 24 + Bloomi). Основний проект KAYA не змінюється.

## Відкрити локально

```bash
cd vendstore
python3 -m http.server 8080
# http://localhost:8080/vendstore/  — якщо сервер з кореня test
# або з папки vendstore: http://localhost:8080/
```

## Стилі

Під час розробки підключаються напряму `css/fonts.css` і `css/style.css` (без мініфікації). Збірку CSS додамо пізніше.

## Тимчасові зображення

Фото та noise взяті з проекту KAYA (`../img/`) — після брендбука замінити файли в `vendstore/img/`:

| Файл | Зараз |
|------|--------|
| `hero-poster.webp` | Hero головної |
| `photo-helper.webp` | Helper 24 |
| `photo-bloomi.webp` | Bloomi |
| `photo-b2b-hero.webp` / `photo-b2c-audience.webp` | Секція «Партнери й гості» |
| `noise-*.webp` | Film grain (як у KAYA) |

## Форми

Заявки йдуть у Telegram через `send.php`. Токени беруться з `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` або з fallback у кореневому `send.php`.

## Сторінки

| Файл | Зміст |
|------|--------|
| `index.html` | Головна (5 секцій) |
| `b2b.html` | Партнерство B2B |
| `b2c.html` | Покупцям B2C |
| `helper.html` | Helper 24 |
| `bloomi.html` | Bloomi |

## Структура головної

1. Hero — основний офер  
2. B2B / B2C — таби аудиторії  
3. Helper 24 / Bloomi — продукти  
4. Етапи співпраці  
5. Форма пропозиції локації  
