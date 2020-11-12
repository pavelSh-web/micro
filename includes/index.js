const less = require('less');

async function renderStyle({ source, data, options } = {}) {
    // Something wrong
    if (!source) {
        return '';
    }

    const out = await less.render(source, {
        compress: false,
        modifyVars: { ..._buildVars(data), ..._buildVarsOld(data) },
        ...options
    });

    return out.css;
}


/*
* Весь рендер LESS на стороне клиента происходит здесь.
* Если в каком то скрипте рендерится самостоятельно - настоятельное требование выполнить рефакторинг и унести функционал сюда
* На данный момент скрипт рендерит стили для блоков и модалок, включая при этом переданные данные в виде переменных
* Принимает обьект с данными БЛОКА (модала), специально ничего подготавливать не нужно
* но можно передать любой обьект
* Данные вида:
{
    ab: '#FFF',
    bc: 'русские буквы',
    cd: 1,
    de: [
        {ab: 1},
        {ab: 3}
    ],
    ef: {
        ab: "string"
    }
}
* превратятся в less переменные:
@ab: #FFF // без кавычек
@cd: 1
@de--ab: "1, 3" // вот такие строки LESS может распарсить как массивы
@ef-ab: "string"
* вложенность таких массивов как de, ef ограничена где то 4 уровнями вложенности
*/

/*
* BUILD VARS
* Специальные переменные из this.data которые необхоидмо вставить как перменные LESS
* собирает обьект без вложенности с данными из блока, которые соответствуют заданным условиям (это путь, число или цвет)
*/

function _buildVarsOld(data, prefix = '', deph = -1) {
    if (typeof data != 'object') {
        return;
    }

    let lessVars = {};

    // В конец префикса дописываем точку
    if (prefix) {
        prefix += '-';
    }

    // если есть id - добавляем переменную с ним
    if (data.id && /^[\d ]*$/.test(data.id)) {
        lessVars.id = data.id;
    }

    deph += 1;

    /* eslint no-loops/no-loops: 0 */
    for (const name in data) {
        if (!data.hasOwnProperty(name) || /^_/.test(name)) {
            continue;
        }

        let value = data[name];
        let fullPath = prefix + name;

        // мы сейчас обходим массив, поэтому опускаем название ключа из префикса
        if (Math.floor(name) >= 0) {
            fullPath = prefix;
        }

        const deny = /[а-яё<>\n\t\`]|\\/gi.test(value);

        // эта строка валидна (без кириллицы, тегов, возможно это цвет или путь, какая то цифра или процент), добавляем сразу
        if (
            typeof value != 'undefined'
            && typeof value != 'object'
            && (typeof value == 'number' || value.length)
            && !deny
        ) {
            const isNumber = /^[\d ]*$/.test(value);
            const isColor = /^\s*(#([\da-f]{3}){1,2}|\w+\((?:\d+%?(?:\s*,\s*)*){3}(?:\d*\.?\d+)?\));?\s*$/i.test(value);
            const isGradient = /^\s*(?:linear-gradient|repeat-linear-gradient)\(.*\)/i.test(value);
            const isColorAndTexture = /^\s*(#([\da-f]{3}){1,2}|\w+\((?:\d+%?(?:\s*,\s*)*){3}(?:\d*\.?\d+)?\))\s*url\((.*)\)$/i.test(value);
            const isCssUrl = /url\([a-z0-9_\/\\\'\"?.,%;:&\(\)]*\)/i.test(value);

            // это цвет
            if (isNumber || isColor || isGradient || isColorAndTexture || isCssUrl) {
                lessVars[fullPath] = value;
            }
            else {
                // В остальных случаях вырезаем кавычки из переменной (меняем одинарный на двойные)
                if (typeof (value) === 'string') {
                    value = value.split('\'')
                        .join('"');
                }
                lessVars[fullPath] = `'${ value }'`;
            }
        }

        // какой то обьект или массив (больше n уровней вложенности не лезем)
        if (deph < 7 && value && typeof value == 'object') {
            // это обьект или массив обьектов, углубляемся
            if (!Array.isArray(value) || (value.length && typeof value[0] == 'object')) {
                lessVars = _extend(lessVars, _buildVars(value, fullPath, deph));
            }
            // это массив
            else {
                lessVars[fullPath] = `'${ value.join(',') }'`;
            }
        }
    }

    return lessVars;
}

// обьединяет 2 обьекта
function _extend(arr1, arr2) {
    if (typeof arr2 != 'object') {
        return arr1;
    }

    const arr = Object.assign({}, arr1);

    for (const key in arr2) {
        if (!arr2.hasOwnProperty(key)) {
            continue;
        }

        const value = arr2[key];

        if (typeof arr[key] != 'undefined' && typeof arr[key] != 'object' && typeof value != 'object') {
            arr[key] += (`, ${ value }`);
        }
        else {
            arr[key] = value;
        }
    }

    return arr;
}

module.exports = renderStyle;

