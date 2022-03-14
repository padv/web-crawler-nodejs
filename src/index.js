const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const urlParser = require('url');

const url = encodeURI("https://books.toscrape.com/"); // May or may not require a "/" after ".com"

const seenUrls = []; 
let urlCounter = 1;
let imgCounter = 1;

const getUrl = (link) => {
	let finalUrl;
	if (!link.includes('http')){
		finalUrl = url + link;
	} else {
		finalUrl = link;
	}
	return finalUrl.replaceAll('../', '');
}

async function downloadImages(imagesUrls){
	for (const imageUrl of imagesUrls) {

		const absoluteUrl = getUrl(imageUrl);
		const config = {
		    responseType: 'stream'
		};
		
		await axios(absoluteUrl, config).then(response => {
			const fileName = path.basename(imageUrl);
			const dest = fs.createWriteStream(`images/${fileName}`);
			response.data.pipe(dest);
			console.log("Image Number: " + imgCounter + " URL: " + absoluteUrl);
			imgCounter++;
		}).catch((err) => {console.log(err.toString()); return;});
	}
}

const crawl = async (url) =>{
	if (seenUrls.indexOf(url) == -1){
		console.log ("Crawling", url);
		seenUrls.push(url);
		console.log(urlCounter);
		urlCounter++;
		const response = await axios(url).catch((err) => {console.log(err.toString()); return 1});
		if (response === 1) return;
		const html = response.data;
		const $ = cheerio.load(html);

		const links = $("a")
			.map((i, link) => link.attribs.href)
			.get()
			.map((link) => getUrl(link)); 

		const imagesUrls = $("img")
			.map((i, imageUrl) => imageUrl.attribs.src)
			.get();

		console.log("Downloading images from URL #" + (urlCounter - 1));
		await downloadImages(imagesUrls);     // Comment to not DL images
		console.log("Finishing downloading images from URL #" + (urlCounter - 1));

		const {host} = urlParser.parse(url);
		const hostLinks = links.filter(link => link.includes(host));

		for (const link of hostLinks){
			if (link !== "/"){
				const absoluteUrl = getUrl(link);
				await crawl(absoluteUrl); // "await" will make it very slow, it is optional here and meant for debugging
			}
		}
	}
}



crawl(url); 

