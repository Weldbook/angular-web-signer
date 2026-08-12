
# @wbd/editor

> Библиотека редактора PDF для Angular с поддержкой аннотаций и цифровой подписи (CAdES).
<p align="left">
  <i>Разработано компанией <strong><a href="https://weldbook.ru">Weldbook</a></strong></i>
</p>
<p align="left">
  <a href="https://weldbook.ru" target="_blank">
    <img src="wb-big-logo.png" alt="Логотип Weldbook" width="300" />
  </a>
</p>



<p align="center">
  <img src="demo-main.png" alt="Скриншот демо-версии WBD Editor" width="100%" />
</p>

[![npm version](https://img.shields.io/npm/v/@wbd/editor)](https://www.npmjs.com/package/@wbd/editor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-18-red)](https://angular.dev)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

`@wbd/editor` отображает PDF-документы во встроенном просмотрщике на базе [PDF.js](https://mozilla.github.io/pdf.js/) и предоставляет полный набор инструментов для аннотирования, а также конвейер цифровой подписи, построенный на основе [CryptoPro](https://cryptopro.ru/) (CAdES).

## Возможности

- **Рендеринг PDF** — полностраничный просмотрщик на базе `ng2-pdfjs-viewer` / PDF.js.
- **Инструменты аннотирования** — карандаш, выделение текста, текст, прямоугольник, линия, комментарии и заглушки для подписей / штампов. Аннотации реализованы как SVG-оверлеи, которые остаются корректно позиционированными при масштабировании документа.
- **Взаимодействие с аннотациями** — инструмент-курсор для перемещения аннотаций, удаление по двойному клику, настройка цвета и размера для каждого инструмента.
- **Цифровые подписи (CAdES)** — получение списка сертификатов, создание отсоединённой подписи, хеш-алгоритмы ГОСТ, простановка меток времени (TSP), проверка подписи и размещение визуальной подписи на PDF.
- **Гибкая настройка** — каждая точка интеграции (загрузка файлов, движок аннотаций, уведомления, скачивание, конфигурация) доступна через injection-токены.
- **UI на Angular Material** — панель инструментов и диалоговые окна построены на компонентах Angular Material.

## Живое демо

Полноценное демонстрационное приложение находится в директории [`demo/`](demo/). Оно подключает библиотеку к in-memory бэкенду для управления файлами и самодостаточному движку аннотаций, что позволяет протестировать все инструменты без сервера.

```bash
# из корня репозитория
npm install
npm run build          # сборка библиотеки в ./dist

npm run demo:install   # cd demo && npm install
npm run demo:serve     # cd demo && npm run serve
```

Затем откройте <http://localhost:4200> и нажмите **Open sample.pdf**.

## Установка

```bash
npm install @wbd/editor
```

### Peer-зависимости

Библиотека ожидает наличия следующих пакетов в потребляющем приложении:

| Пакет                    | Версия                           |
|--------------------------|----------------------------------|
| `@angular/core`          | `^18.0.0`                        |
| `@angular/common`        | `^18.0.0`                        |
| `@angular/forms`         | `^18.0.0`                        |
| `@angular/router`        | `^18.0.0`                        |
| `@angular/material`      | `^18.0.0`                        |
| `pdf-lib`                | `^1.17.0 \|\| ^2.0.0`            |
| `@pdf-lib/fontkit`       | `^1.1.0`                         |
| `ng2-pdfjs-viewer`       | `^25.0.0`                        |
| `ngx-color-picker`       | `^16.0.0`                        |
| `moment`                 | `^2.29.0`                        |
| `uuid`                   | `^9.0.0 \|\| ^10.0.0`            |
| `rxjs`                   | `~7.8.0`                         |
| `crypto-pro`             | `^4.0.0` _(опционально, см. ниже)_ |

> **Примечание:** `crypto-pro` является опциональной зависимостью. Это пакет браузерного плагина CAdES, необходимый только для функциональности цифровых подписей. См. [демо](demo/README.md) для информации о том, как заменить его заглушкой.

## Использование

### 1. Импорт модуля

```typescript
import { NgModule } from '@angular/core';
import { WbdEditorModule } from '@wbd/editor';

@NgModule({
  imports: [WbdEditorModule.forRoot()],
})
export class AppModule {}
```

### 2. Конфигурация библиотеки (`forRoot`)

```typescript
import { WbdEditorModule, WBD_DOWNLOAD, WBD_EDITOR_ANNOTATES } from '@wbd/editor';
import { MyAnnotatesService } from './my-annotates.service';

@NgModule({
  imports: [
    WbdEditorModule.forRoot({
      signerServiceUrl: 'https://signer.example.com',
      apiUrl: 'https://api.example.com',
      extraImports: [SharedModule],
      extraProviders: [
        { provide: WBD_EDITOR_ANNOTATES, useClass: MyAnnotatesService },
        {
          provide: WBD_DOWNLOAD,
          useValue: (data: any, filename: string) => { /* логика скачивания */ },
        },
      ],
    }),
  ],
})
export class AppModule {}
```

### 3. Создание документа и открытие в редакторе

```html
<wbd-editor></wbd-editor>
```

```typescript
import { EditorDocument, EditorDocumentSourceType } from '@wbd/editor';

const doc = new EditorDocument({
  source: 'assets/sample.pdf',       // ссылка на файл, ArrayBuffer, Blob, ...
  sourceType: EditorDocumentSourceType.FileLink,
  filename: 'sample.pdf',
});
```

Библиотека читает активные документы из `localStorage` по ключу `editorFiles` — см. [демо](demo/src/app/home/home.component.ts) для точной структуры сериализации.

### 4. Цифровая подпись

```typescript
import { EditorSignerService } from '@wbd/editor';

@Component({ /* ... */ })
export class MyComponent {
  constructor(private signer: EditorSignerService) {}

  listCertificates() {
    this.signer.getCertificates().subscribe((certs) => console.log(certs));
  }

  async sign(doc: EditorDocument, certificate: any, signField: any) {
    const result = await this.signer.createSign(
      doc.content!,       // байты PDF
      certificate,        // выбранный сертификат
      signField,          // геометрия поля подписи
      null,
      doc.signedContent ?? undefined,
    );
    return result; // { documentContent, signatureContent, documentVisualSigContent }
  }
}
```

> Для подписания требуется установленный в браузере пользователя плагин `crypto-pro`. На неподдерживаемых платформах список сертификатов будет просто пустым.

### 5. Подключение ассетов пакета

Редактор загружает иконки и изображения курсоров из `/assets/`, а скрипт плагина CryptoPro из `/static/`. Пакет поставляется с этими файлами в `node_modules/@wbd/editor/assets/`, поэтому добавьте следующие записи в массив `assets` вашего `angular.json` (или аналогичную конфигурацию сборщика):

```json
{
  "glob": "**/*",
  "input": "node_modules/@wbd/editor/assets/imgs",
  "output": "/assets/imgs"
},
{
  "glob": "**/*",
  "input": "node_modules/ng2-pdfjs-viewer/pdfjs",
  "output": "/assets/pdfjs"
},
{
  "glob": "cadesplugin_api.js",
  "input": "node_modules/@wbd/editor/assets",
  "output": "/static"
}
```

> `cadesplugin_api.js` необходим только для работы с цифровыми подписями. При тестировании без браузерного плагина CryptoPro вы можете использовать заглушку из [демо](demo/src/static/cadesplugin_api.js).

## Точки расширения

Библиотека спроектирована для интеграции с вашим собственным бэкендом. Все точки интеграции внедряются через токены:

| Токен / API              | Назначение                                                  |
|--------------------------|-------------------------------------------------------------|
| `WBD_EDITOR_ANNOTATES`   | Движок аннотаций (API в стиле `pdf-annotate.js`)            |
| `WBD_EDITOR_CONFIG`      | `EditorRuntimeConfig` — URL-адреса бэкенда                  |
| `WBD_COMMENTS`           | Реестр комментариев к аннотациям                            |
| `WBD_ANNOTATIONS_OBJECT` | Внешний объект состояния аннотаций                          |
| `WBD_DOWNLOAD`           | Хелпер для скачивания файлов в браузере                     |
| `WBD_SNACKBAR_SERVICE`   | Абстрактный `WbdSnackbarService` — уведомления              |
| `WBD_SNACKBAR_COMPONENT` | Компонент для отображения уведомлений                       |

Файлы, обслуживаемые бэкендом, загружаются через `apiUrl`, указанный в `WbdEditorConfig` (файл запрашивается по адресу `{apiUrl}/{fileId}`); загрузка и сохранение подписей являются ответственностью кода вашего приложения.

## Справочник API

### Модули

| Экспорт | Описание |
|---------|----------|
| `WbdEditorModule` | Основной модуль. Используйте `.forRoot(config?)` для настройки дополнительных импортов/провайдеров. |
| `EditorAnnotateModule` | Модуль движка аннотаций (рендеринг + привязка панели инструментов). |
| `WbdEditorConfig` | `{ signerServiceUrl?, apiUrl?, extraImports?, extraProviders? }` |

### Компоненты

| Компонент | Селектор | Описание |
|-----------|----------|----------|
| `EditorComponent` | `wbd-editor` | Корневой контейнер редактора. |
| `WbdEditorAnnotateComponent` | `app-wbd-editor-annotate` | Панель аннотаций + просмотрщик PDF. |
| `SaveFileNotificationComponent` | — | Уведомление о подтверждении сохранения. |
| `CloseFileComponent` | — | Диалог подтверждения закрытия файла. |
| `WbSuggestedEmployeesComponent` | — | Список предложенных сотрудников (диалог подписанта). |
| `SignatureInfoComponent` | — | Диалог с деталями подписи. |

### Сервисы

| Сервис | Описание |
|--------|----------|
| `EditorSignerService` | Операции с цифровыми подписями: `getCertificates`, `createSign`, `generateHash`, `signHash`, `placeVisibleSignature`, `sendFileForSign` и другие. |

### Модели

| Класс / Тип | Описание |
|-------------|----------|
| `EditorDocument` | Модель документа (`source`, `sourceType`, `filename`, `content`, `signedContent`, `annotations`, `signatures`, ...). |
| `EditorDocumentSourceType` | Перечисление: `FileLink`, `ArrayBuffer`, `Uint16Array`, `Blob`. |
| `FileLink` | Псевдоним типа для `string`. |
| `DataFileForSign` | Полезная нагрузка для `EditorSignerService.sendFileForSign`. |
| `SignatureObject` | Геометрия поля подписи (`fieldName`, `rect`, `page`). |

## Сборка библиотеки

```bash
npm install
npm run build
```

Скомпилированный пакет записывается в `dist/`.

## Публикация

```bash
npm run build
npm publish dist   # или: npm run publish:lib (сборка + публикация)
```

`ng-packagr` копирует метаданные пакета, `LICENSE`, этот `README.md` и runtime-ассеты (см. [Подключение ассетов пакета](#5-подключение-ассетов-пакета)) в публикуемый tarball. Выполните `npm pack --dry-run` внутри `dist/` для проверки содержимого перед публикацией.

## Запуск демо

```bash
npm run build          # сначала соберите библиотеку (демо использует file:../dist)
npm run demo:install
npm run demo:serve     # http://localhost:4200
```

Подробности см. в [`demo/README.md`](demo/README.md).

## Вклад в проект

Пожалуйста, прочтите [CONTRIBUTING.md](CONTRIBUTING.md) для получения информации о кодексе поведения и процессе отправки pull request'ов.

## История изменений

См. [CHANGELOG.md](CHANGELOG.md).

## Безопасность

Об уязвимостях просим сообщать ответственно — см. [SECURITY.md](SECURITY.md).

## Лицензия

[MIT](LICENSE)