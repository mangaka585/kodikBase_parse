global.fetch = require("node-fetch");
var fs = require('fs');
const RegExp1 = /[.,\/#!?∞$%\^&\*;:{}=\-_`~()]/g;
const RegExp2 = /\s/g;

const Parse = function(){

	function Anime(
		id, 
		link,
		title, 
		title_orig,
		year, 
		last_season,
		last_episode,
		total_episodes,
		image,
		duration,
		genre_1,
		genre_2,
		genre_3,
		imdb,
		description,
		updated,
		episodes
		) {
	  this.id = id;
	  this.link = link;
	  this.title = title;
	  this.title_orig = title_orig;
	  this.year = year;
	  this.last_season = last_season;
	  this.last_episode = last_episode;
	  this.total_episodes = total_episodes;
	  this.image = image;
	  this.duration = duration;
	  this.genre_1 = genre_1;
	  this.genre_2 = genre_2;
	  this.genre_3 = genre_3;
	  this.imdb = imdb;
	  this.description = description;
	  this.updated = updated;
	  this.episodes = episodes;
	};

	function Episode(
		number,
		link
	) {
		this.number = number;
		this.link = link;
	}

	let Animelist = {
		animelist : []
	}

	fs.readFile('./anime-serial.json', 'utf8', function (err, data) {
	    if (err) console.log("Error while reading anime-serial file!", err);
		let results = JSON.parse(data);

	    /*function Season(
	    	number
	    	) {
	    	this.number = number;
		}*/
		
		function getEpisodes(id) {
			fetch('https://kodikapi.com/search?token=d0846c79e4bd6a60bc2ea6341dcf519e&id=serial-' + id + '&with_episodes=true')
				.then(response => response.json())
				.then(data => {
					let jsonObj = JSON.stringify(data);
					let obj = JSON.parse(jsonObj);
					if(obj.results[0].seasons[1].episodes !== undefined) {
						let episodesArray = [];
						let episodes = obj.results[0].seasons[1].episodes;
						for (episode in episodes) {
							let newEpisode = new Episode(episode, episodes[episode]);
							episodesArray.push(newEpisode);
						}
						fs.writeFile("./episodes.json", JSON.stringify(episodesArray), function(err) {
							if(err) {
								return console.log("Error while episodes.json file writing - " + err);
							}
							console.log("The file episodes.json was saved!");
						});
					}
				})
				.catch(err => console.log('Error while request episodes from kodikDB api! Code : ' + err));
		}

		//Аниме
	    for (key in results) {
		  if (results.hasOwnProperty(key)) {
			let obj = results[key];
		    if(obj.material_data !== undefined){
			    let anime = new Anime(
			    	obj.id.replace('serial-',''), 
					obj.material_data.title_en === undefined ? "" : obj.material_data.title_en.replace(RegExp1,'').replace(RegExp2,'-').toLowerCase(),
			    	obj.title === undefined ? "" : obj.title, 
			    	obj.title_orig === undefined ? "" : obj.title_orig,
			    	obj.year === undefined ? "" : obj.year, 
			    	obj.last_season === undefined ? "" : obj.last_season,
			    	obj.last_episode === undefined ? "" : obj.last_episode,
			    	obj.episodes_count === undefined ? "" : obj.episodes_count,
			    	obj.material_data.poster_url === undefined ? "" : obj.material_data.poster_url,
			    	obj.material_data.duration === undefined ? "" : obj.material_data.duration,
			    	obj.material_data.anime_genres === undefined || obj.material_data.anime_genres[0] === undefined ? "" : obj.material_data.anime_genres[0],
			    	obj.material_data.anime_genres === undefined || obj.material_data.anime_genres[1] === undefined ? "" : obj.material_data.anime_genres[1],
			    	obj.material_data.anime_genres === undefined || obj.material_data.anime_genres[2] === undefined ? "" : obj.material_data.anime_genres[2],
			    	obj.material_data.imdb_rating === undefined ? "" : obj.material_data.imdb_rating,
			    	obj.material_data.description === undefined ? "" : obj.material_data.description,
			    	obj.updated_at === undefined ? "" : obj.updated_at
					);
					
					//Запрос базу данных для поиска этого аниме, чтобы извлечь его эпизоды
					getEpisodes(obj.id.replace('serial-',''));

				//Его эпизоды
				/*for (episode in obj.seasons) {
				  if (obj.seasons.hasOwnProperty(season)) {
				  	let seasonObj = new Season(season);

				  	for (link in obj.seasons[season].episodes){
				  		let attrName = "episode-" + link;
				  		seasonObj[attrName] = obj.seasons[season].episodes[link].link;
				  	}

				  	anime.seasons = seasonObj;
				  }
				}*/

			    Animelist.animelist.push(anime);
			}
		  } 
		}

		//Переводим в JSON
		let exp = JSON.stringify(Animelist);

		//Пишем результат в файл
		fs.writeFile("./resultbaseDB.json", exp, function(err) {
		    if(err) {
		        return console.log("Error while resultbaseDB.json file writing - " + err);
		    }
		    console.log("The file resultbaseDB.json was saved!");
		});

	})
}

Parse();