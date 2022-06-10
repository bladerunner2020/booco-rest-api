**Описание библиотеки**

BOOCO REST API

**Содержание:**

[1. Общее описание](#1общее-описание)

[2. Режимы работы](#_Toc105691910)

[3. Структура библиотеки](#_Toc105691911)

[4. Описание классов](#_Toc105691912)

[4.1. Класс BoocoRestApi](#_Toc105691913)

[4.1.1. Параметры класса BoocoRestApi](#_Toc105691914)

[4.1.2. Свойства класса BoocoRestApi](#_Toc105691915)

[4.1.3. Методы класса BoocoRestApi](#_Toc105691916)

[4.1.4. События класса BoocoRestApi](#_Toc105691917)

[4.2. Класс DeviceFactory](#_Toc105691918)

[4.2.1. Свойства класса DeviceFactory](#_Toc105691919)

[4.2.2. Методы класса DeviceFactory](#_Toc105691920)

[4.2.3. События класса DeviceFactory](#_Toc105691921)

[4.3. Класс Logger](#_Toc105691922)

[4.3.1. Свойства класса Logger](#_Toc105691923)

[4.3.2. Методы класса Logger](#_Toc105691924)

[5. Готовые примеры](#_Toc105691925)

# 1.Общее описание

Библиотека booco-rest-api служит для работы с методами REST API сервера BOOCO.

# 2. Режимы работы

Библиотека позволяет работать с REST API сервера BOOCO в следующих режимах:

-   Отправка http(s)-запросов: GET, POST, DELETE, PUT, PATCH;
-   Подписка на обновления (через подключение к TCP-порту).

# 3. Структура библиотеки

Библиотека содержит следующие классы:

-   **Class BoocoRestApi** — это основной класс для работы с REST API. В приложении создается обычно 1 экземпляр объекта этого класса.
-   **class DeviceFactory** — создается в виде свойства equipment в классе BoocoRestApi.
-   **class Logger** — создается в виде свойства log в классе BoocoRestApi.

# 4. Описание классов

## 4.1. Класс BoocoRestApi

Класс BoocoRestApi наследуется от класса EventEmitter.

### 4.1.1. Параметры класса BoocoRestApi

При инициализации экземпляра объекта класса можно указать следующие параметры:

-   **host** — адрес хоста сервера BOOCO (по умолчанию: *'127.0.0.1'*);
-   **port** — порт для отправки запросов (по умолчанию: *80*);
-   **socketPort** — порт для подписки tcp socket (по умолчанию: *5990*);
-   **apiBaseUrl** — базовый URL для REST API (по умолчанию: *'/api/v1/'*);
-   **username** — имя пользователя REST API (значение по умолчанию: *'admin'*);
-   **password** — пароль пользователя REST API (значение по умолчанию: *'admin'*).

**Примечание**. *Все указанные параметры являются необязательными.*

**Пример использования**

Инициализация экземпляра объекта класса с указанием параметров **host**, **port**, **socketPort**, **apiBaseUrl**, **username** и **password**:

```js
  const { BoocoRestApi } = require('..');

  const booco = new BoocoRestApi({
    host = '127.0.0.1',
    port: 3000,
    socketPort = 5990,
    apiBaseUrl = '/api/v1/',
    username = 'admin',
    password = 'admin',
});
```

### 4.1.2. Свойства класса BoocoRestApi

Класс BoocoRestApi имеет следующие свойства:

- **equipment** — тип DeviceFactory;
- **log** — тип Logger.

Свойства **equipment** и **log** создаются при инициализации экземпляра объекта класса BoocoRestApi.

**Пример использования**

```js
    booco.log.info(infoMessage);
    await booco.equipment.setChannel('Relay', 'toggleRelay1');
```

### 4.1.3. Методы класса BoocoRestApi

Класс BoocoRestApi имеет следующие методы:

-   **login(callback)**;
-   **connect(callback)**;
-   **callRestApi**();
-   **destroy()**.

#### **4.1.3.1. Метод login(callback)**

Метод **login(callback)** служит для авторизации в REST API. Параметр callback является необязательным и возвращает Promise.

Если указан callback, то метод вызывает его с параметром null в случае успеха или возвращает ошибку, если авторизация не удалась. Если используется callback, то Promise всегда разрешается.

**Примеры использования**

1.  Выполняется авторизация в REST API. Если авторизация не удалась, то в логах сохраняется сообщение об ошибке. В случае успешной авторизации в логах сохраняется имя скрипта, с помощью которого была выполнена авторизация, и отправляется команда на устройство **Relay** для переключения на 1-ый канал:

```js
    booco.log.info(infoMessage);
      booco.login((err) => {
    if (err) {
      console.log('authorization error');
    } else {
      booco.log.info('Connected from script – Welcome!');
      console.log('REST API logged on');
      await booco.equipment.setChannel('Relay', 'toggleRelay1');
    }
  });
```

1.  Выполняется авторизация в REST API, отправляется команда на устройство **Relay** для переключения на 1-ый канал и производится подключение к серверу BOOCO. Если подключиться не удалось, выводится сообщение об ошибке:

```js
    booco.login().then(async () => {
      booco.log.info('Connected from script - Welcome!');
      console.log('REST API logged on');
      const feedbacks = await booco.equipment.getFeedback('Relay');
      console.log(feedbacks)
      await booco.equipment.setChannel('Relay', 'toggleRelay1');
      booco.connect(() => {
      console.log('');
    });

    }).catch(async () => {
      console.error ('authorization error');
    });
```

1.  После подключения создается подписка на состояния следующих устройств: **Relay**, **Projector** **1**, **Projector** **2**, **Player** **1**:

```js
    booco.on('connect', () => {
      booco.equipment.subscribe(['Relay', 'Projector 1', 'Projector 2']);
      booco.equipment.subscribe('Player 1');
    });
```

1.  Создается подписка на изменения канала устройства **Relay5** с указанием старого и нового каналов:

```js
    booco.equipment.on('Relay.relay5', (value, oldValue) => {
      console.log(`Relay.relay5: ${oldValue} => ${value}`);
    });
```

1.  Создается подписка на все фидбеки устройств **Player 1**, **Projector 1** и **Projector 2**. Полученный массив данных выводится в лог:

```js
    booco.equipment.on('Player 1', (value) => {
      console.log(value);
    });

    booco.equipment.on('Projector 1', (value) => {
      console.log(value);
    });

    booco.equipment.on('Projector 2', (value) => {
      onsole.log(value);
    });
```

#### **4.1.3.2. Метод connect(callback)**

Метод **connect(callback)** служит для подключения к серверу BOOCO к порту TCP. Необходимо для использования механизма подписки. Параметр callback является необязательным. После подключения отправляет строку *'ping'* с периодом **PING_TIMEOUT** (длительность 10000 мс). В ответ ожидает *'pong'*. Если *'pong'* не приходит, то разрывает соединение. При разрыве соединения (по любой причине) необходимо дождаться завершения **RECONNECTION_TIMEOUT** (длительность 10000 мс) и затем повторить попытку подключения. При подключении отправляется событие **connect** и вызывается **callback** с параметром **null** (если он задан). Данный метод рекомендуется вызывать после успешного выполнения метода **login()**.

**Пример использования**

Выполняется подключение к серверу BOOCO. Если подключение установить не удалось, то выводится сообщение об ошибке. В случае успешного подключения информация об этом сохраняется в журнал. После этого создается подписка на все фидбеки устройств **Projector 1**, **Projector 2** и **Player 1**.

```js
    booco.connect((err) => {
    if (err) {
      console.error(err.message)
    }else{
      console.info('Connection to server was successful')
      booco.equipment.subscribe(['Relay', 'Projector 1', 'Projector 2']);
      booco.equipment.subscribe('Player 1');
    }
  });
```

#### **4.1.3.3. Метод callRestApi()**

Метод **callRestApi**() служит для обращения к методам REST API, для которых нет обертки в библиотеке. Данный метод используется, в основном, как внутренний, но также может использоваться и как публичный.

Метод имеет следующие параметры:

-   **method** — 'GET' - метод запроса (GET, POST, DELETE, PUT, PATCH);
-   **url** — URL запроса;
-   **data** — данные;
-   **dataType** — тип данных (по умолчанию 'json') либо готовые данные для отправки в запросе (например, строка или Buffer);

**Примеры использования**

Отправляет запрос на конечную точку для получения массива данных (списка оборудования и его свойств) для всех устройств с типом *'pjlink-device':*

```js
    booco.callRestApi(
    {
      method: 'GET',
      url: '/api/v1/equipment?driver=pjlink-device',
      data: '',
      dataType: 'json'
    }, (err, data) =>{
    if(err){
      console.error(err.message)
    }else{
      console.log(data)
    }
  })
```

В ответе приходит статус об успешном выполнении запроса и массив данных (параметры **id**, **name**, **host**, **driver**):

```json
    "status": "success",
    "data": [
    {
      "_id": "qkd4zyoz8wWoopRQN",
      "name": "Projector 1",
      "host": "192.168.10.10",
      "driver": "pjlink-device"
    },
    {
      "_id": "rCpgsRnX4dnXNoAQA",
      "name": "Projector 2",
      "host": "192.168.10.11",
      "driver": "pjlink-device"
    }
    ]
```

#### **4.1.3.4. Метод destroy()**

Метод **destroy()** предназначен для уничтожения экземпляра BoocoRestApi (отключение от порта, удаление всех таймеров и т.д.).

### 4.1.4. События класса BoocoRestApi

Подписка на события реализована через механизм EventEmitter - метод on() и др.

Класс BoocoRestApi может отправлять следующие события:

-   **login** — отправляется при успешной авторизации в REST API;
-   **connect** — отправляется при успешном подключении к tcp-порту;
-   **error** — отправляется при возникновении ошибок (в качестве параметра приходит ошибка).

**Примеры использования**

1.  Выполняется авторизация, создается подписка на событие по входу в систему с **callback(error).** При неуспешном входе выводит сообщение об ошибке. В случае успеха выводит сообщение **'REST API logged on'**:

```js
    booco.on('login', (err) => {
    if(err){
      console.error(err.message)
    } else {
      console.log('REST API logged on')
    }
    })
```

1.  Выполняется подключение к серверу Booco, создается подписка на событие по входу в систему с **callback(error).** При неуспешном входе выводит сообщение об ошибке. В случае успеха выводит сообщение **'REST API logged on'**:

```js
    booco.on('connect', (err) => {
    if(err){
      console.error(err.message)
    } else {
      console.info(‘server connection established’)
    }
    })
```

## 4.2. Класс DeviceFactory

Класс **DeviceFactory** наследуется от класса **EventEmitter**.

При инициализации BoocoRestApi создается экземпляр объекта класса **DeviceFactory** и передается ссылка на BoocoRestApi для доступа к функциям REST API.

### 4.2.1. Свойства класса DeviceFactory

У класса нет публичных свойств.

### 4.2.2. Методы класса DeviceFactory

Класс **DeviceFactory** имеет следующие методы:

-   **getFeedback(name, feedback);**
-   **setChannel(name, channel, value);**
-   **subscribe(nameOrNames).**

#### **4.2.2.1. Метод getFeedback(name, feedback)**

Метод **getFeedback(name, feedback)** возвращает значение обратной связи (**feedback**) для устройства (**name**). Если **feedback** не указан, то возвращает значения всех обратных связей. Возвращает **Promise**.

**Пример использования**

Возвращает значение всех и одного **feedback** устройства **Relay**:

```js
    const allFeedback = await booco.equipment.getFeedback('Relay');

    const feedback = await booco.equipment.getFeedback('Relay', 'relay1' );

    console.info(allFeedback);

    console.info(feedback);
```

#### **4.2.2.2. Метод setChannel(name, channel, value)**

Метод **setChannel(name, channel, value)** отправляет команду (**channel**) со значением (**value**) на устройство (**name**). Возвращает **Promise**.

**Пример использования**

Отправляет команду на устройство **Relay** установить 1-ый канал:

```js
    await booco.equipment.setChannel('Relay', 'toggleRelay1');
```

#### **4.2.2.3. Метод subscribe(nameOrNames)**

Метод **subscribe(nameOrNames)** выполняет подписку на уведомления, которые отправляются при изменении обратной связи устройства или устройств. **nameOrNames** - имя устройства или список имен устройств. Метод вызывается после получения события connect в BoocoRestApi.

**Пример использования**

Создает подписку на получение уведомлений при изменении обратной связи устройств **Relay, Projector 1, Projector 2**\*,\* а также устройства **Player 1**.

```js
    booco.equipment.subscribe(['Relay', 'Projector 1', 'Projector 2']);
    booco.equipment.subscribe('Player 1');
```

### 4.2.3. События класса DeviceFactory

Подписка на события реализуется через механизм **EventEmitter** - метод on() и др.

Класс **DeviceFactory** может отправлять следующие события:

-   \<**name**\\\> - массив данных, который содержит имя устройства, параметры объекта, содержащего старые и новые значения **feedback**;
-   **\<name\\\>.\\\<feedback\\\>** - массив данных, содержащий старое и новое значения **feedback** для указанного канала;

**Примеры использования**

Создает подписку на изменение 5 канала устройства **Relay** и получает новое и старое значения:

```js
    booco.equipment.on('Relay.relay5', (value, oldValue) => {
      console.log(`Relay.relay5: ${oldValue} => ${value}`);
    });
```

## 4.3. Класс Logger

Экземпляр объекта класса **Logger** создается при инициализации **BoocoRestApi**. При инициализации передается ссылка на **BoocoRestApi** для доступа к функциям REST API.

### 4.3.1. Свойства класса Logger

У класса нет публичных свойств.

### 4.3.2. Методы класса Logger

Класс Logger имеет следующие методы:

-   **info(message)** - сохраняет в журнале (БД для хранения сообщений) информационное событие с текстом **message**;

**Пример использования**

```js
    console.info(err.message);
```

-   **warn(message)** - сохраняет в журнале предупреждение с текстом **message**;

**Пример использования**

```js
    console.warn (err.message);
```

-   **error(message)** - сохраняет в журнале ошибку **message**;

**Пример использования**

```js
    console.error(err.message);
```

-   **debug(message)** - сохраняет в журнале отладочное событие с текстом **message**.

**Пример использования**

```js
    console.debug(err.message);
```

# 5. Готовые примеры

Готовые примеры скриптов хранятся в открытом репозитории на GitHub и доступны для загрузки по следующей ссылке: <https://github.com/bladerunner2020/booco-rest-api/tree/master/src>
