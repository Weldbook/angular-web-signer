# EditorAnnotate


### Структура модуля EditorAnnotate:

Модуль EditorAnnotate состоит из 4 функциональных каталогов:
 * [Comments](https://github.com/woerr/angular-weldbook.ru/tree/master/src/app/modules/editor-annotate/comments)
 * [EditorAnnotates](https://github.com/woerr/angular-weldbook.ru/tree/master/src/app/modules/editor-annotate/editorAnnotates)
 * [RenderSvg](https://github.com/woerr/angular-weldbook.ru/tree/master/src/app/modules/editor-annotate/renderSvg)
 * [UI](https://github.com/woerr/angular-weldbook.ru/tree/master/src/app/modules/editor-annotate/UI)

 
 
 ### Функциональные каталоги:
 
* Каталог  [Comments](https://github.com/woerr/angular-weldbook.ru/tree/master/src/app/modules/editor-annotate/comments)
отвечает за комментарии и является реестром комментариев. Файл [comments.ts](https://github.com/woerr/angular-weldbook.ru/tree/master/src/app/modules/editor-annotate/comments/comments.ts)
* Каталог  [EditorAnnotates](https://github.com/woerr/angular-weldbook.ru/tree/master/src/app/modules/editor-annotate/editorAnnotates) содержит класс [EditorAnnotates](https://github.com/woerr/angular-weldbook.ru/tree/master/src/app/modules/editor-annotate/editorAnnotates/index.ts),
 который является триггером в управлении состояния редактора аннотация. Является связующим между пользовательским интерфейсом и самой логикой редактора.
* Каталог  [RenderSvg](https://github.com/woerr/angular-weldbook.ru/tree/master/src/app/modules/editor-annotate/renderSvg)
отвечает за рендер добавляемых svg элементов в редакторе аннотаций.
* Каталог  [UI](https://github.com/woerr/angular-weldbook.ru/tree/master/src/app/modules/editor-annotate/UI)
содержит файлы: 
    * [edit.ts](https://github.com/woerr/angular-weldbook.ru/tree/master/src/app/modules/editor-annotate/UI/edit.ts) - Инструмент Выделение
    * [index.ts](https://github.com/woerr/angular-weldbook.ru/tree/master/src/app/modules/editor-annotate/UI/index.ts) - Родительский класс UI, включающий методы по поиску svg элементов в редакторе, редактированию комментариев, отслеживания координат и получения метаданных.
    * [line.ts](https://github.com/woerr/angular-weldbook.ru/tree/master/src/app/modules/editor-annotate/UI/line.ts) - Инструмент Линия
    * [pen.ts](https://github.com/woerr/angular-weldbook.ru/tree/master/src/app/modules/editor-annotate/UI/pen.ts) - Инструмент Кисть
    * [point.ts](https://github.com/woerr/angular-weldbook.ru/tree/master/src/app/modules/editor-annotate/UI/point.ts) - Инструмент Комментарий
    * [rect.ts](https://github.com/woerr/angular-weldbook.ru/tree/master/src/app/modules/editor-annotate/UI/rect.ts) - Инструмент Прямоугольник
    * [text.ts](https://github.com/woerr/angular-weldbook.ru/tree/master/src/app/modules/editor-annotate/UI/text.ts) - Инструмент Текст