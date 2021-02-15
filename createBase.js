//В этом файле реализовано формирование базы аниме на основании файла, предоставленного сайтом kodik
//Все функции будут реализованы в async/await формате

//Подключаем необходимые ресурсы для работы
const fetch = require('node-fetch');                                //Для работы со сторонними API
const fs = require('fs');                                           //Для работы с файовой системой
const Config = require('./config');                                 //Для доступа к константам (ссылкам, файлам). Настройка входящих данных именно там

let newAnimeFileObj = {};                                           //Конечный объект
let errorCount = 0;

//Функция прочтения файла базы Kodik
async function readFile(file){
    let result = fs.readFileSync(file, 'utf-8');

    return JSON.parse(result);
}

//Конструктор для объекта аниме
function Anime(id, link, title, title_orig, year, episodes_count, updated_at, status, description, poster, genres, rating, producers, episodes) {
    return {
        id,
        link,
        title,
        title_orig,
        year,
        episodes_count,
        updated_at,
        status,
        description,
        poster,
        genres,
        rating,
        producers,
        episodes
    };
}

//Функция получения объекта с сериями аниме
async function getEpisodes(animeId){
    return await fetch(`${Config.seriesAPI}${animeId}&with_episodes=true`)
        .then(response => response.json())
        .then(function (res) {
            let objKey = Object.keys(res.results[0].seasons)[0];
            return res.results[0].seasons[objKey].episodes;
        })
        .catch(err => errorCount+=1);
}

//Функция создания объекта аниме из базы
async function createAnime(obj) {

    //RegExp контанты для преобразования строк в нужные нам значения
    const RegExp1 = /[.,\/#!?∞$%\^&\*;:{}=\-_`~()]/g;
    const RegExp2 = /\s/g;

    //Элементы, из которых строим объект аниме
    const id = obj.id.replace('serial-', '');
    const link = obj.title_orig.replace(RegExp1,'').replace(RegExp2,'-').toLowerCase();
    const title = obj.title;
    const title_orig = obj.title_orig;
    const year = obj.year;
    const updated_at = obj.updated_at;
    const status = obj.material_data.anime_status;
    const description = obj.material_data.description;
    const poster = obj.material_data.poster_url;
    const genres = obj.material_data.anime_genres;
    const rating = obj.material_data.imdb_rating || obj.material_data.shikimori_rating;
    const producers = obj.material_data.producers || obj.material_data.directors;
    const episodes = await getEpisodes(id);                                                             
    const episodes_count = await Object.keys(episodes).length;

    const anime = new Anime(
        id, 
        link,
        title,
        title_orig,
        year,
        episodes_count,
        updated_at,
        status,
        description,
        poster,
        genres,
        rating,
        producers,
        episodes
    );

    if (newAnimeFileObj[link] === undefined) {
        newAnimeFileObj[link] = anime;
        console.log(`${link} added -> Series - ${episodes_count}`);
    } else if (anime.episodes_count > newAnimeFileObj[link][episodes_count]) {
        console.log(`   ${link} is already added, but I update it because of more episodes -> ${newAnimeFileObj[link][episodes_count]} rewrite to ${episodes_count}`);
        newAnimeFileObj[link] = anime;
    } else console.log(`    ${link} is already added >_< Series - ${episodes_count}`);
}

//Функция обработки всех объектов в файле (цикл)
async function wholeObjects(obj){
    for(key in obj) {
        let item = obj[key];
        if(item.id && item.link && item.title && item.title_orig && item.year && item.updated_at && item.material_data) {
            await createAnime(item);
        }
    }
}

//Главная функция
async function start(){

    let fileBase = await readFile(Config.baseFile);                 //Получили объект с коллекцией аниме
    await wholeObjects(fileBase)
    await fs.writeFile("./newDB.json", JSON.stringify(newAnimeFileObj), function(err) {
        if(err) {
            return console.log("Error while newDB.json file writing - " + err);
        }
        console.log("The file newDB.json was saved!");
    });
    //await console.log(JSON.stringify(newAnimeFileObj));
    await console.log(errorCount);
}

//Вызываем главную функцию
start();



//Сейчас все работает отлично, нужно добавить проверку на link, чтобы не было одинаковых аниме, и проверить как это будет работать (отсутствие одинаковых аниме)