"use strict";
/* ==========================================================
   common.js — loaded on every page
   1. Helpers  2. Translations (RU / EN)  3. Data store
   4. Theme & language  5. Header / footer  6. Cards, pager, orders
   ========================================================== */

/* ---------- 1. Helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const PAGE = document.body.dataset.page || "home";
const HOME = PAGE === "home" ? "" : "index.html";
const ANY = "Любое удобное время", OWN = "Свой дизайн";   // stored values (kept for existing data)
const U = id => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const imgSt = o => `object-fit:${esc(o.fit || "cover")};object-position:${esc(o.pos || "center")}`;
const toast = m => { const x = document.createElement("div"); x.className = "toast"; x.setAttribute("role", "status"); x.textContent = m; document.body.append(x); setTimeout(() => x.remove(), 3500) };
const shrink = (f, m = 700) => new Promise(r => { const i = new Image(); i.onload = () => { const k = Math.min(1, m / Math.max(i.width, i.height)), c = document.createElement("canvas"); c.width = i.width * k; c.height = i.height * k; c.getContext("2d").drawImage(i, 0, 0, c.width, c.height); r(c.toDataURL("image/jpeg", .8)) }; i.src = URL.createObjectURL(f) });

/* ---------- 2. Translations: key -> [Russian, English] ---------- */
const L = {
  /* shared chrome */
  "brand.sub": ["Дарья Нейлс", "Nail studio"],
  "nav.svc": ["Услуги", "Services"], "nav.works": ["Работы", "Work"], "nav.rec": ["Рекомендуем", "Recommended"],
  "nav.shop": ["Магазин", "Shop"], "nav.about": ["Дарья", "About"], "nav.book": ["Запись", "Book"], "nav.contact": ["Контакты", "Contact"],
  "nav.aria": ["Основное меню", "Main menu"], "menu": ["Меню", "Menu"], "theme": ["Сменить тему", "Toggle theme"],
  "cta.call": ["Записаться и связаться", "Book & connect"],
  "ft.city": ["Darya Nails · Керчь", "Darya Nails · Kerch"], "ft.admin": ["Вход для мастера", "Staff login"],
  "title.home": ["Darya Nails — студия маникюра, Керчь", "Darya Nails — nail studio, Kerch"],
  "title.rec": ["Рекомендуем — Darya Nails", "Recommended — Darya Nails"],
  "title.ok": ["Заявка отправлена — Darya Nails", "Request sent — Darya Nails"],
  "title.admin": ["Darya Nails — панель мастера", "Darya Nails — studio dashboard"],

  /* catalog cards, pager, sorting */
  "kind.Услуга": ["Услуга", "Service"], "kind.Товар": ["Товар", "Product"], "kind.Дизайн": ["Дизайн", "Design"],
  "c.book": ["Записаться", "Book now"], "c.order": ["Заказать", "Order"], "c.contact": ["Связаться", "Contact us"],
  "more": ["Показать ещё", "Show more"], "sort.l": ["Сортировка", "Sort by"], "sort.d": ["По умолчанию", "Default"],
  "sort.h": ["Сначала дорогие", "Highest price first"], "sort.lo": ["Сначала дешёвые", "Lowest price first"],

  /* home */
  "hero.p": ["Авторский маникюр и нейл-арт в Керчи. Безупречное покрытие, редкие оттенки и дизайн по вашему референсу.", "Signature manicure and nail art in Kerch. Flawless finish, rare shades and designs from your own reference."],
  "hero.book": ["Записаться онлайн", "Book online"], "hero.works": ["Наши работы", "Our work"], "hero.rec": ["Рекомендуем", "Recommended"],
  "hero.alt": ["Нейл-арт Darya Nails", "Darya Nails nail art"],
  "svc.h": ["Маникюр и нейл-арт", "Manicure & nail art"], "svc.sub": ["Услуги и актуальные цены. Выберите нужную — и запишитесь в один клик.", "Services and current prices. Choose one and book in a single click."],
  "works.h": ["Наши работы", "Our work"], "works.sub": ["Реальные результаты наших клиентов. Нажмите на фото, чтобы рассмотреть работу.", "Real results from our clients. Tap a photo to take a closer look."],
  "prd.h": ["Магазин", "Shop"], "prd.sub": ["Уход за ногтями и аксессуары. Закажите в один клик — мы подтвердим заказ в WhatsApp.", "Nail care and accessories. Order in one click — we will confirm your order on WhatsApp."],
  "about.h": ["Дарья", "Darya"], "about.role": ["Основатель студии · мастер маникюра", "Studio founder · nail artist"],
  "about.text": ["Здравствуйте, я Дарья — основатель студии Darya Nails. Для меня маникюр — это авторская работа, а не конвейер: я выверяю форму, довожу покрытие до безупречного состояния и создаю дизайн, который подчёркивает ваш образ. Каждый визит проходит в спокойной атмосфере и по строгим стандартам гигиены.", "Hello, I'm Darya, founder of Darya Nails. To me a manicure is bespoke craft, not a production line: I perfect the shape, bring the finish to flawless and create a design that flatters your look. Every visit takes place in a calm atmosphere under strict hygiene standards."],
  "about.l1": ["Индивидуальный подход к каждому образу", "A personal approach to every look"],
  "about.l2": ["Защитная одежда, перчатки и инструменты в крафт-пакетах", "Protective clothing, gloves and tools in kraft packs"],
  "about.l3": ["Спокойная атмосфера и время только для вас", "A calm atmosphere and time that is only yours"],
  "about.alt": ["Дарья — основатель студии Darya Nails", "Darya, founder of Darya Nails"],
  "book.h": ["Запишитесь на удобное время", "Book a time that suits you"],
  "book.sub": ["Регистрация не нужна. Оставьте имя и номер — мы перезвоним и подтвердим время.", "No sign-up needed. Leave your name and number and we will call to confirm the time."],
  "f.name": ["Ваше имя", "Your name"], "f.name.er": ["Введите имя.", "Enter your name."],
  "f.phone": ["Телефон", "Phone"], "f.phone.er": ["Введите корректный номер телефона.", "Enter a valid phone number."],
  "f.design": ["Дизайн", "Design"], "f.own": ["Свой дизайн (по референсу)", "My own design (from a reference)"],
  "f.date": ["Желаемая дата", "Preferred date"], "f.time": ["Удобное время", "Preferred time"], "time.any": ["Любое удобное время", "Any time that suits me"],
  "f.up.t": ["Загрузить фото", "Upload photos"], "f.up.s": ["Перетащите до 3 фото сюда или нажмите, чтобы загрузить", "Drop up to 3 photos here or click to upload"],
  "f.note": ["Пожелания", "Notes"], "f.note.ph": ["Форма, длина, цвет", "Shape, length, colour"],
  "f.submit": ["Отправить заявку", "Send request"], "f.sending": ["Отправляем…", "Sending…"],
  "ct.h": ["Как нас найти", "How to find us"],
  "ct.addr": ["Россия, г. Керчь, район Аршинцево,\nул. Орджоникидзе, 33, помещение 5", "Kerch, Russia, Arshintsevo district,\nOrdzhonikidze St., 33, Room 5"],
  "ct.hint": ["Здание библиотеки, вход сбоку, рядом с вывеской «Нотариус».", "Library building, side entrance, next to the “Notarius” sign."],
  "ct.call": ["Позвонить", "Call"], "ct.wa": ["WhatsApp", "WhatsApp"], "ct.wa.s": ["Написать", "Message"], "ct.vk": ["ВКонтакте", "VK"], "ct.vk.s": ["Страница", "Profile"],

  /* recommended page */
  "rec.h": ["Рекомендуем", "Recommended"], "rec.sub": ["Выбор студии, тренды сезона и советы по уходу — всё в одном месте.", "Studio picks, season trends and care tips — all in one place."],
  "rec.picks": ["Выбор студии", "Studio picks"], "rec.tr": ["Тренды", "Trends"], "rec.tp": ["Уход дома", "Home care"], "rec.sg": ["Фирменные стили", "Signature styles"],
  "rec.empty": ["Рекомендации скоро появятся.", "Recommendations are coming soon."], "rec.home": ["← На главную", "← Back to home"],

  /* success page */
  "ok.h": ["Заявка отправлена", "Request sent"],
  "ok.p": ["Спасибо, {0}! Мы получили вашу заявку и скоро перезвоним, чтобы подтвердить время.", "Thank you, {0}! We received your request and will call you shortly to confirm the time."],
  "ok.p0": ["Спасибо! Мы получили вашу заявку и скоро перезвоним, чтобы подтвердить время.", "Thank you! We received your request and will call you shortly to confirm the time."],
  "ok.design": ["Дизайн", "Design"], "ok.date": ["Дата", "Date"], "ok.time": ["Время", "Time"], "ok.phone": ["Телефон", "Phone"], "ok.note": ["Пожелания", "Notes"],
  "ok.anydate": ["Любая дата", "Any date"], "ok.wa": ["Отправить также в WhatsApp", "Also send via WhatsApp"],
  "ok.home": ["На главную", "Back to home"], "ok.again": ["Новая запись", "Book again"],
  "wa.book": ["Здравствуйте! Заявка с сайта: {0}, {1}. Дизайн: {2}. Дата: {3}. Время: {4}.", "Hello! Booking request from the website: {0}, {1}. Design: {2}. Date: {3}. Time: {4}."],
  "wa.note": [" Пожелания: {0}.", " Notes: {0}."], "wa.any": ["любая", "any"],
  "wa.order": ["Здравствуйте! Хочу заказать: {0} — {1}", "Hello! I would like to order: {0} — {1}"],

  /* admin: navigation & common */
  "a.site": ["← на сайт", "← View site"],
  "a.t.bk": ["Записи", "Bookings"], "a.t.cl": ["Клиенты", "Clients"], "a.t.fn": ["Финансы", "Finance"], "a.t.it": ["Каталог", "Catalog"], "a.t.wk": ["Галерея", "Gallery"], "a.t.st": ["Сайт", "Site"],
  "a.cancel": ["Отмена", "Cancel"], "a.yes": ["Да", "Yes"], "a.del": ["Удалить", "Delete"], "a.save": ["Сохранить", "Save"], "a.confirm": ["Подтвердить", "Confirm"],
  "a.edit": ["Изменить", "Edit"], "a.full": ["Хранилище браузера заполнено. Удалите часть фото или подключите сервер.", "Browser storage is full. Remove some photos or connect a server."],
  "a.preview": ["Референс", "Reference"], "a.rmphoto": ["Удалить фото", "Remove photo"],
  /* admin: bookings */
  "a.bk.h": ["Записи", "Bookings"], "a.client": ["Клиент", "Client"], "a.design": ["Дизайн", "Design"], "a.design.ph": ["Например, Глянцевый нюд", "e.g. Glossy nude"],
  "a.date": ["Дата", "Date"], "a.time": ["Время", "Time"], "a.price": ["Стоимость, ₽", "Price, ₽"], "a.nb.add": ["Добавить запись", "Add booking"],
  "a.search.ph": ["Поиск: имя, телефон, дизайн…", "Search: name, phone, design…"], "a.search": ["Поиск", "Search"], "a.filter": ["Фильтр", "Filter"],
  "a.f.all": ["Все записи", "All bookings"], "a.f.new": ["Новые", "New"], "a.f.unpaid": ["Не оплачено", "Unpaid"], "a.f.paid": ["Оплачено", "Paid"], "a.f.cancel": ["Отменённые", "Cancelled"],
  "a.csv": ["Скачать CSV", "Download CSV"],
  "st.new": ["Новая", "New"], "st.confirmed": ["Подтверждена", "Confirmed"], "st.done": ["Выполнена", "Completed"], "st.paid": ["Оплачена", "Paid"], "st.cancel": ["Отменена", "Cancelled"],
  "a.status": ["Статус", "Status"], "a.paid": ["Оплачено", "Paid"], "a.unpaid": ["Не оплачено", "Unpaid"],
  "a.web": ["Заказ с сайта", "Website order"], "a.delbk": ["Удалить запись", "Delete booking"], "a.delbk.q": ["Удалить запись?", "Delete this booking?"],
  "a.addphoto": ["＋ фото", "＋ photo"], "a.addphoto.a": ["Добавить фото", "Add photos"],
  "a.nobk": ["Записей не найдено. Заявки с сайта появятся здесь автоматически.", "No bookings found. Requests from the website will appear here automatically."],
  "a.addclient": ["Сначала добавьте клиента на вкладке «Клиенты».", "Add a client in the Clients tab first."], "a.untitled": ["Без названия", "Untitled"],
  "k.new": ["Новые", "New"], "k.today": ["Сегодня", "Today"], "k.unpaid": ["Не оплачено", "Unpaid"], "k.d7": ["7 дней", "7 days"], "k.month": ["Месяц", "Month"], "k.total": ["Всего", "Total"], "k.avg": ["Средний чек", "Average sale"],
  "csv.price": ["Цена", "Price"], "csv.pay": ["Оплата", "Payment"],
  /* admin: clients */
  "a.cl.h": ["Клиенты", "Clients"], "a.name": ["Имя", "Name"], "a.phone": ["Телефон", "Phone"], "a.notes": ["Заметки", "Notes"], "a.notes.ph": ["Форма, аллергии, предпочтения", "Shape, allergies, preferences"],
  "a.upphoto": ["Загрузить фото", "Upload photos"], "a.saveclient": ["Сохранить клиента", "Save client"], "a.savechg": ["Сохранить изменения", "Save changes"],
  "a.badclient": ["Введите имя и корректный номер телефона.", "Enter a name and a valid phone number."], "a.nonotes": ["Без заметок", "No notes"],
  "a.visits": ["Визитов: {0} · Оплачено: {1}", "Visits: {0} · Paid: {1}"], "a.delclient": ["Удалить клиента и его записи?", "Delete this client and their bookings?"],
  "a.noclients": ["Клиентов пока нет. Добавьте первого выше.", "No clients yet. Add the first one above."],
  /* admin: finance */
  "a.fn.h": ["Финансы", "Finance"], "a.chart": ["Выручка за 14 дней", "Revenue, last 14 days"], "a.tx": ["Транзакции", "Transactions"], "a.paidon": ["Дата оплаты", "Paid on"], "a.sum": ["Сумма, ₽", "Amount, ₽"],
  "a.notx": ["Нет оплаченных записей. Переведите запись в статус «Оплачена», и она попадёт сюда.", "No paid bookings yet. Set a booking to “Paid” and it will appear here."],
  /* admin: catalog */
  "a.it.h": ["Каталог", "Catalog"], "a.it.info": ["«Услуга» попадает в раздел «Маникюр и нейл-арт», «Товар» — в «Магазин». Галочка «Показывать в «Рекомендуем»» выводит позицию ещё и на страницу рекомендаций. Изменения видны на сайте сразу.", "“Service” appears under Manicure & nail art, “Product” under Shop. The “Show in Recommended” box also lists the item on the Recommended page. Changes go live on the site immediately."],
  "a.type": ["Тип", "Type"], "a.title.ru": ["Название (русский)", "Title (Russian)"], "a.title.en": ["Название (английский)", "Title (English)"],
  "a.desc.ru": ["Описание (русский)", "Description (Russian)"], "a.desc.en": ["Описание (английский)", "Description (English)"],
  "a.cprice": ["Цена, ₽", "Price, ₽"], "a.old": ["Старая цена, ₽ (зачёркнутая)", "Old price, ₽ (struck through)"], "a.showrec": ["Показывать в «Рекомендуем»", "Show in Recommended"],
  "a.photo": ["Фото", "Photo"], "a.itadd": ["Добавить в каталог", "Add to catalog"], "a.badit": ["Введите название и цену.", "Enter a title and a price."],
  "a.badold": ["Старая цена должна быть больше новой.", "The old price must be higher than the new one."], "a.inrec": ["★ в «Рекомендуем»", "★ in Recommended"],
  "a.disc": ["Скидка, %", "Discount, %"], "a.discbtn": ["Скидка", "Discount"], "a.discoff": ["Снять", "Remove"], "a.baddisc": ["Введите скидку от 1 до 99 %.", "Enter a discount from 1 to 99 %."],
  "a.repl": ["Заменить фото", "Replace photo"], "a.rmimg": ["Убрать фото", "Remove photo"],
  "a.ratio": ["Пропорции", "Aspect ratio"], "a.fit": ["Вписывание", "Fit"], "a.fit.s": ["Вписать", "Fit"], "a.pos": ["Положение", "Position"], "a.pos.l": ["Положение фото", "Photo position"],
  "a.delit": ["Удалить позицию с сайта?", "Remove this item from the site?"], "a.noit": ["Пока ничего нет. Добавьте первую услугу или товар.", "Nothing here yet. Add your first service or product."],
  "r.auto": ["Авто", "Auto"], "r.sq": ["Квадрат 1:1", "Square 1:1"], "r.land": ["Альбом 4:3", "Landscape 4:3"], "r.wide": ["Широкий 16:9", "Wide 16:9"], "r.p45": ["Портрет 4:5", "Portrait 4:5"], "r.p34": ["Портрет 3:4", "Portrait 3:4"],
  "fit.fill": ["Заполнить", "Fill"], "fit.contain": ["Вписать целиком", "Fit whole image"],
  "pos.c": ["По центру", "Centre"], "pos.t": ["Сверху", "Top"], "pos.b": ["Снизу", "Bottom"], "pos.l": ["Слева", "Left"], "pos.r": ["Справа", "Right"],
  /* admin: gallery */
  "a.wk.h": ["Галерея «Наши работы»", "“Our work” gallery"], "a.wk.info": ["Загрузите фото выполненных работ — они сразу появятся на сайте.", "Upload photos of finished work — they appear on the site right away."],
  "a.wk.title": ["Название", "Title"], "a.wk.title.ph": ["Например, Хром и кристаллы", "e.g. Chrome & crystals"], "a.wk.photo": ["Фото работы", "Photo of the work"], "a.wk.add": ["Добавить работу", "Add work"],
  "a.wk.pick": ["Выберите фото работы.", "Choose a photo of the work."], "a.rename": ["Переименовать", "Rename"], "a.rename.h": ["Переименовать работу", "Rename work"],
  "a.left": ["Сдвинуть влево", "Move left"], "a.right": ["Сдвинуть вправо", "Move right"], "a.delwk": ["Удалить фото из галереи?", "Remove this photo from the gallery?"],
  "a.nowk": ["Фото пока нет. Загрузите первую выполненную работу.", "No photos yet. Upload your first finished work."],
  /* admin: site settings */
  "a.st.h": ["Сайт", "Site"], "a.st.info": ["Меняйте тексты, контакты и главные фото сайта. Пустое поле — остаётся исходный текст. Если английское поле пустое, на английской версии показывается русский текст. Изменения видны на сайте сразу.", "Edit the site's texts, contacts and main photos. An empty field keeps the default text. If an English field is empty, the English site shows the Russian text. Changes go live immediately."],
  "a.st.hero": ["Шапка и главный экран", "Header & hero"], "a.s.call": ["Кнопка в шапке (русский)", "Header button (Russian)"], "a.s.calle": ["Кнопка в шапке (английский)", "Header button (English)"],
  "a.s.hero": ["Подзаголовок (русский)", "Subtitle (Russian)"], "a.s.heroe": ["Подзаголовок (английский)", "Subtitle (English)"], "a.s.himg": ["Главное фото", "Main photo"],
  "a.reset": ["Вернуть исходное", "Restore default"],
  "a.st.about": ["О мастере", "About the artist"], "a.s.role": ["Должность (русский)", "Role (Russian)"], "a.s.rolee": ["Должность (английский)", "Role (English)"],
  "a.s.atext": ["Текст о мастере (русский)", "About text (Russian)"], "a.s.atexte": ["Текст о мастере (английский)", "About text (English)"], "a.s.mimg": ["Фото мастера", "Photo of the artist"],
  "a.st.contacts": ["Контакты", "Contacts"], "a.s.ph": ["Телефон", "Phone"], "a.s.wa": ["WhatsApp (номер)", "WhatsApp (number)"], "a.s.vk": ["Ссылка ВКонтакте", "VK link"],
  "a.s.ad": ["Адрес, русский (каждая строка — с новой строки)", "Address, Russian (one line per row)"], "a.s.ade": ["Адрес, английский", "Address, English"],
  "a.s.adh": ["Как найти (русский)", "Directions (Russian)"], "a.s.adhe": ["Как найти (английский)", "Directions (English)"],
  "a.st.rec": ["Страница «Рекомендуем»", "“Recommended” page"], "a.st.rec.i": ["Каждая строка: Название | Описание", "One per line: Title | Description"],
  "a.s.tr": ["Тренды (русский)", "Trends (Russian)"], "a.s.tre": ["Тренды (английский)", "Trends (English)"], "a.s.tp": ["Уход дома (русский)", "Home care (Russian)"], "a.s.tpe": ["Уход дома (английский)", "Home care (English)"],
  "a.s.sg": ["Фирменные стили (русский)", "Signature styles (Russian)"], "a.s.sge": ["Фирменные стили (английский)", "Signature styles (English)"],
  "a.st.backup": ["Резервная копия", "Backup"], "a.st.backup.i": ["Данные хранятся в этом браузере. Скачивайте копию регулярно и переносите её на другое устройство.", "Your data is stored in this browser. Download a backup regularly and move it to other devices."],
  "a.bkx": ["Скачать копию (JSON)", "Download backup (JSON)"], "a.bki": ["Восстановить из файла", "Restore from file"],
  "a.restore.q": ["Заменить все текущие данные данными из файла?", "Replace all current data with the data from this file?"], "a.restore": ["Заменить", "Replace"],
  "a.restored": ["Данные восстановлены.", "Data restored."], "a.badfile": ["Файл не подходит.", "This file can't be used."],
  "a.savesite": ["Сохранить изменения сайта", "Save site changes"], "a.saved": ["Сохранено — изменения уже на сайте.", "Saved — the changes are live on the site."],
  "a.himg.alt": ["Главное фото", "Main photo"], "a.mimg.alt": ["Фото мастера", "Photo of the artist"]
};
const ARABIC = ["تم الدفع", "لم يتم الدفع"];   // kept from the original admin panel

/* default content shown until the master edits it: [ru title, ru text, en title, en text] */
const RD = {
  tr: [["Хромовая втирка", "Зеркальный блеск с жемчужным отливом.", "Chrome powder", "Mirror shine with a pearly glow."], ["Кошачий глаз", "Магнитный эффект, который играет на свету.", "Cat eye", "A magnetic effect that plays with the light."], ["Молочный нюд", "Тёплая нейтраль на каждый день.", "Milky nude", "A warm neutral for every day."], ["Микро-френч", "Тонкая линия вместо привычной белой каймы.", "Micro French", "A fine line instead of the usual white tip."]],
  tp: [["Масло для кутикулы", "Наносите каждый вечер: кожа вокруг ногтя остаётся мягкой.", "Cuticle oil", "Apply every evening to keep the skin around the nail soft."], ["Перчатки для уборки", "Бытовая химия сокращает срок носки покрытия.", "Gloves for cleaning", "Household chemicals shorten the wear of the coating."], ["Не срывайте покрытие", "Снимайте у мастера, чтобы не повредить ногтевую пластину.", "Do not peel the coating", "Have it removed by a technician to protect the nail plate."], ["Коррекция через 3–4 недели", "Так форма и покрытие выглядят безупречно весь срок.", "Refill after 3–4 weeks", "Shape and finish then look flawless for the whole wear."]],
  sg: [["Тихая роскошь", "Нюд и чистая форма.", "Quiet Luxury", "Nude and a clean shape."], ["Полночь и золото", "Вечерний дизайн с фольгой.", "Midnight & Gold", "An evening design with foil."], ["Нежные сердца", "Белая основа и ручная роспись.", "Tender Hearts", "A white base with hand painting."]]
};
const DESIGNS = [["Тихая роскошь", "Quiet Luxury"], ["Глянцевый нюд", "Glossy Nude"], ["Сияющий хром", "Radiant Chrome"], ["Черепаховый узор", "Tortoiseshell"], ["Полночь и золото", "Midnight & Gold"], ["Нежные сердца", "Tender Hearts"]];

const WSEED = [
  { id: 1, img: U("1519014816548-bf5fe059798b"), title: "Нюд с глянцем", te: "Glossy nude" },
  { id: 2, img: U("1522337660859-02fbefca4702"), title: "Хром и кристаллы", te: "Chrome & crystals" },
  { id: 3, img: U("1604654894610-df63bc536371"), title: "Черепаховый узор", te: "Tortoiseshell" },
  { id: 4, img: U("1754799670312-8e7da8e40ad7"), title: "Полночь и золото", te: "Midnight & gold" }];
const SEED = [
  { id: 1, kind: "Услуга", title: "Маникюр с покрытием гель-лак", te: "Manicure with gel polish", desc: "Аппаратная обработка, выравнивание и стойкое покрытие до 4 недель.", de: "Precision prep, smoothing and a long-wear gel finish of up to 4 weeks.", price: 2000, old: 0, img: U("1571290274554-6a2eaa771e5f"), rec: true },
  { id: 2, kind: "Услуга", title: "Авторский нейл-арт", te: "Signature nail art", desc: "Ручная роспись, фольга и кристаллы по вашему референсу.", de: "Hand-painted art, foil and crystals from your own reference.", price: 2500, old: 3000, img: U("1522337660859-02fbefca4702"), rec: true },
  { id: 3, kind: "Услуга", title: "Хром и втирка", te: "Chrome & powder", desc: "Зеркальный эффект с жемчужным отливом.", de: "A mirror effect with a pearly glow.", price: 2300, old: 0, img: U("1604654894610-df63bc536371"), rec: false },
  { id: 4, kind: "Товар", title: "Масло для кутикулы", te: "Cuticle oil", desc: "Ежедневный уход за кожей вокруг ногтя.", de: "Daily care for the skin around the nail.", price: 600, old: 0, img: U("1754799670312-8e7da8e40ad7"), rec: true },
  { id: 5, kind: "Товар", title: "Набор по уходу за ногтями", te: "Nail care set", desc: "Всё для поддержания маникюра дома.", de: "Everything to keep your manicure perfect at home.", price: 1500, old: 1800, img: U("1754799670410-b282791342c3"), rec: false }];

let lang = "ru"; try { lang = localStorage.getItem("dnLang") || "ru" } catch (e) { }
const en = () => lang === "en";
function t(k, ...a) { const v = L[k]; if (!v) return k; return a.reduce((s, x, i) => s.replace("{" + i + "}", x), v[en() ? 1 : 0]) }
const tm = v => v === ANY ? t("time.any") : v;                    // stored time value -> label
const ttl = it => en() && it.te ? it.te : it.title;
const dsc = it => en() && it.de ? it.de : it.desc;
const fmt = n => new Intl.NumberFormat(en() ? "en-US" : "ru-RU").format(Math.round(n)) + " ₽";

function applyI18n() {
  root.lang = lang;
  $$("[data-i18n]").forEach(e => e.textContent = t(e.dataset.i18n));
  [["ph", "placeholder"], ["aria", "aria-label"], ["alt", "alt"], ["title", "title"]].forEach(([k, a]) =>
    $$(`[data-i18n-${k}]`).forEach(e => e.setAttribute(a, t(e.dataset["i18n" + k[0].toUpperCase() + k.slice(1)]))));
  if (document.body.dataset.title) document.title = t(document.body.dataset.title);
  const b = $("#lang"); if (b) { b.textContent = en() ? "RU" : "EN"; b.setAttribute("aria-label", en() ? "Переключить на русский" : "Switch to English") }
}
function setLang(l) {
  lang = l; try { localStorage.setItem("dnLang", l) } catch (e) { }
  window.onLang && window.onLang();      // pages re-render their dynamic content
  applyI18n(); applySite();
}

/* ---------- 3. Data store (browser localStorage, key "dn" as before) ---------- */
function db() {
  let x = {}; try { x = JSON.parse(localStorage.getItem("dn") || "{}") || {} } catch (e) { }
  x.clients = x.clients || []; x.bookings = x.bookings || []; x.items = x.items || SEED; x.works = x.works || WSEED; x.site = x.site || {};
  return x;
}
function dbSave(x) { try { localStorage.setItem("dn", JSON.stringify(x)); return true } catch (e) { return false } }
const waNum = () => ((db().site || {}).wa || "").replace(/\D/g, "") || "79785100511";
function recList(k) {                                             // trends / care / styles for the current language
  const s = db().site || {};
  if (en() && s.listsEn && s.listsEn[k]) return s.listsEn[k];
  if (s.lists && s.lists[k]) return s.lists[k];
  return RD[k].map(x => en() ? [x[2], x[3]] : [x[0], x[1]]);
}

/* ---------- 4. Theme ---------- */
try { root.dataset.theme = localStorage.getItem("dnTheme") || (matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light") } catch (e) { }
function toggleTheme() { root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark"; try { localStorage.setItem("dnTheme", root.dataset.theme) } catch (e) { } }

/* ---------- 5. Header, footer, site overrides ---------- */
function buildChrome() {
  const hd = $("#hd"), ft = $("#ft"); if (!hd) return;
  const d = db(), has = k => d.items.some(i => i.kind === k);
  const link = (h, k, id, hide) => `<a href="${h}" data-i18n="${k}"${id ? ` id="${id}"` : ""}${hide ? " hidden" : ""}></a>`;
  hd.className = "site";
  hd.innerHTML = `<a class="brand" href="${HOME || "#top"}"><span>Darya Nails</span><small data-i18n="brand.sub"></small></a>
  <nav class="main" id="nav" data-i18n-aria="nav.aria">
    ${link(HOME + "#services", "nav.svc", "nsvc", !has("Услуга"))}${link(HOME + "#works", "nav.works", "nwrk", !d.works.length)}
    <a href="recommended.html" data-i18n="nav.rec"${PAGE === "rec" ? ' aria-current="page"' : ""}></a>
    ${link(HOME + "#products", "nav.shop", "nprd", !has("Товар"))}${link(HOME + "#about", "nav.about")}${link(HOME + "#book", "nav.book")}${link(HOME + "#contact", "nav.contact")}
  </nav>
  <div class="tools">
    <button class="ic" id="lang" type="button"></button>
    <button class="ic" id="theme" type="button" data-i18n-aria="theme"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg></button>
    <a class="btn sm" id="hcall" href="${HOME}#book" data-i18n="cta.call"></a>
    <button class="ic burger" id="burger" type="button" aria-expanded="false" aria-controls="nav" data-i18n-aria="menu">☰</button>
  </div>`;
  if (ft) { ft.className = "site"; ft.innerHTML = `<span data-i18n="ft.city"></span> · <a href="admin.html" data-i18n="ft.admin"></a>` }
  $("#nav").onclick = e => { if (e.target.closest("a")) closeNav() };
  $("#burger").onclick = () => { const o = $("#nav").classList.toggle("open"); $("#burger").setAttribute("aria-expanded", o) };
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeNav() });
}
const closeNav = () => { const n = $("#nav"); if (n) { n.classList.remove("open"); $("#burger").setAttribute("aria-expanded", "false") } };

function bindTools() {                                            // theme + language buttons (site and admin)
  const th = $("#theme"), lg = $("#lang");
  if (th) th.onclick = toggleTheme;
  if (lg) lg.onclick = () => setLang(en() ? "ru" : "en");
}

function applySite() {                                            // overrides saved by the master in admin → Site
  const s = db().site || {}, pick = (a, b) => (en() && s[b]) || s[a];
  const T = (sel, v, br) => { const el = $(sel); if (!el || !v) return; if (br) { el.textContent = ""; v.split("\n").forEach((l, i) => { if (i) el.append(document.createElement("br")); el.append(l) }) } else el.textContent = v };
  T("#hcall", pick("call", "calle")); T("#herop", pick("hero", "heroe")); T("#arole", pick("role", "rolee")); T("#atext", pick("atext", "atexte"));
  T("#ad", pick("addr", "addre"), 1); T("#adh", pick("hint", "hinte")); T("#cph", s.phone);
  const I = (sel, v, fit, pos, ratio) => { const el = $(sel); if (!el) return; if (el._o === undefined) el._o = el.getAttribute("src"); if (v) el.src = v; else el.src = el._o; el.style.objectFit = fit || ""; el.style.objectPosition = pos || ""; if (ratio !== undefined) el.style.aspectRatio = ratio || "" };
  I("#himg", s.himg, s.himgfit, s.himgpos); I("#mimg", s.mimg, s.mimgfit, s.mimgpos, s.mimgratio);
  const tel = $("#cphl"); if (tel) { let p = (s.phone || "").replace(/\D/g, ""); if (p.length === 11 && p[0] === "8") p = "7" + p.slice(1); tel.href = "tel:+" + (p || "79785100511") }
  const wa = $("#cwa"); if (wa) wa.href = "https://wa.me/" + waNum();
  const vk = $("#cvk"); if (vk) { if (vk._h === undefined) vk._h = vk.getAttribute("href"); vk.href = s.vk || vk._h }
}

/* ---------- 6. Cards, pager, page transition, orders ---------- */
function card(it) {
  const ti = ttl(it), pct = it.old > it.price ? Math.round((1 - it.price / it.old) * 100) : 0, prod = it.kind === "Товар";
  return `<article class="card"><div class="pic"${it.ratio ? ` style="aspect-ratio:${esc(it.ratio)}"` : ""}>${it.img ? `<img style="${imgSt(it)}" src="${esc(it.img)}" alt="${esc(ti)}" loading="lazy" onerror="this.remove()">` : ""}${pct ? `<span class="tag off">−${pct}%</span>` : ""}<span class="tag kd">${esc(t("kind." + it.kind))}</span></div>
  <div class="cb"><h3>${esc(ti)}</h3><p>${esc(dsc(it))}</p><div class="pr"><b>${fmt(it.price)}</b>${it.old > it.price ? `<s>${fmt(it.old)}</s>` : ""}</div>
  <div class="ca">${prod ? `<button class="btn sm" type="button" data-oid="${it.id}">${t("c.order")}</button><a class="lnk" href="${HOME}#contact">${t("c.contact")}</a>` : `<button class="btn sm o" type="button" data-pick="${esc(it.title)}">${t("c.book")}</button>`}</div></div></article>`;
}
/* Pager: shows `page` items; "Show more" reveals the next batch and — only then — the sort bar. */
function mkPager({ box, btn, sortBar, page = 4, onMore }) {
  let shown = page, expanded = false;
  btn.onclick = () => { shown += page; expanded = true; onMore() };
  return {
    draw(list, fn) {
      box.innerHTML = list.slice(0, shown).map(fn).join("");
      btn.hidden = list.length <= shown;
      if (sortBar) sortBar.hidden = !(expanded && list.length > 1);
    }
  };
}
const sortBy = (l, v) => v === "high" ? [...l].sort((a, b) => b.price - a.price) : v === "low" ? [...l].sort((a, b) => a.price - b.price) : l;

function go(url) {                                                // elegant exit transition, then navigate
  const c = document.createElement("div"); c.className = "curtain out"; c.innerHTML = "<span>Darya Nails</span>"; document.body.append(c);
  setTimeout(() => location.href = url, matchMedia("(prefers-reduced-motion:reduce)").matches ? 0 : 750);
}

document.addEventListener("click", e => {
  const p = e.target.closest("[data-pick]");
  if (p) {                                                        // "Book now" on a service
    if (PAGE === "home") { $("#design").value = p.dataset.pick; $("#book").scrollIntoView(); setTimeout(() => $("[name=name]").focus({ preventScroll: true }), 500) }
    else location.href = "index.html?pick=" + encodeURIComponent(p.dataset.pick) + "#book";
    return;
  }
  const b = e.target.closest("[data-oid]"); if (!b) return;       // "Order" on a product → WhatsApp
  const x = db(), it = x.items.find(i => i.id == b.dataset.oid); if (!it) return;
  x.bookings.push({ id: Date.now(), clientId: 0, design: "Заказ: " + it.title, date: "", time: "", note: "Заказ из магазина (WhatsApp)", ref: "", refs: [], status: "new", price: it.price, created: new Date().toISOString() });
  dbSave(x);
  window.open("https://wa.me/" + waNum() + "?text=" + encodeURIComponent(t("wa.order", ttl(it), fmt(it.price))), "_blank", "noopener");
});

buildChrome(); bindTools(); applyI18n(); applySite();
