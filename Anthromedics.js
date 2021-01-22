{
	"translatorID": "f409c307-b7de-46f4-b185-715107325d0f",
	"label": "Anthromedics",
	"creator": "Christoph Holtermann",
	"target": "anthromedics.org",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2021-01-22 21:25:33"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2020 Christoph Holtermann
	
	This file is part of Zotero.

	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/


function detectWeb(doc, url) {
	// TODO: adjust the logic here
	if (url.includes('/PRA-')) {
		return "journalArticle";
	}
	else if (url.includes('/DMS-')) {
		return "journalArticle";
	}
	else if (getSearchResults(doc, true)) {
		return "multiple";
	}
	return false;
}

function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	// TODO: adjust the CSS selector
	var rows = doc.querySelectorAll('div.title>a[href*="/DMS"],div.title>a[href*="/PRA"]');
	//Z.debug(rows);
	for (let row of rows) {
		//Z.debug(row);
		// TODO: check and maybe adjust
		let href = row.href;
		// TODO: check and maybe adjust
		let title = ZU.trimInternal(row.textContent);
		Z.debug(href+" "+title);
		if (!href || !title) continue;
		if (checkOnly) return true;
		found = true;
		items[href] = title;
	}
	Z.debug(items);
	return found ? items : false;
}

function doWeb(doc, url) {
	if (detectWeb(doc, url) == "multiple") {
		Zotero.selectItems(getSearchResults(doc, false), function (items) {
			if (items) ZU.processDocuments(Object.keys(items), scrape);
		});
	}
	else {
		scrape(doc, url);
	}
}

function scrapeMerkurstab(doc, url){
	var newItem = new Zotero.Item("journalArticle");
	newItem.url = doc.location.href;
	Z.debug(newItem);
	
	var main = doc.getElementById('contentMain');
    if (!main) return false;
    
    newItem.publicationTitle = "Der Merkurstab. Zeitschrift für Anthroposophische Medizin";
    newItem.ISSN = "0935798X";
    
    var title = ZU.xpathText(main, './/article[@class="article"]//h1[@class="title"]');
	Z.debug(title);
	newItem.title = title;
    
    var authors = ZU.xpathText(main, './/p[@class="article-data"]/span[@class="authors"]/a');
	// Z.debug(authors);
	authors = authors.split(",");
	Z.debug(authors);
	for (let author of authors) {
		Z.debug(author);
		newItem.creators.push(Zotero.Utilities.cleanAuthor(author, "author", false));
	}
	
	var article_info = ZU.xpathText(main, './/p[@class="article-data"]/span[@class="article-info"]');
	Z.debug(article_info);
	info_re = /(Der Merkurstab )?(\d{4});(\d{1,2})\((\d+)\):([\d\w-]+)/;
	res = info_re.exec(article_info);
	
	Z.debug(res);
	
	var year = res[2];
	Z.debug("year: "+year);
	newItem.date = year;
	
	var volume = res[3];
	Z.debug("volume: "+volume);
	newItem.volume = volume;
	
	var issue = res[4];
	Z.debug("issue: "+issue);
	newItem.issue = issue;
	
	var pages = res[5];
	Z.debug("pages: "+pages);
	newItem.pages = pages;
	
	var DOI = ZU.cleanDOI(ZU.xpathText(main, './/p[@class="article-data"]/span[@class="article-doi"]/a'));
    Z.debug(DOI);
    newItem.DOI = DOI;
	
	var language = DOI.slice(-2);
	Z.debug("language: "+language);
	newItem.language = language;
	
	var abstract = ZU.xpathText(main, './/article[@class="article"]//div[@id="abstract_de"]/p');
    Z.debug("abstractNote: "+abstract);
    newItem.abstractNote = abstract;
	
	var article_id = ZU.xpathText(main, './/p[@class="article-data"]/span[@class="article-id"]');
	var re_article_id = /Artikel-ID: (\w{3}-\d{5}-\w{2})/;
	var article_id_re = re_article_id.exec(article_id);
	var article_id_clean = article_id_re[1];
	Z.debug(article_id_clean);
	
	var pdfurl = "https://www.anthromedics.org/" + article_id_clean + ".pdf";
	Z.debug("pdfurl: "+pdfurl);
    newItem.attachments.push({
	    title:"Full Text PDF",
	    mimeType:"application/pdf",
	    url:pdfurl
    });
	
	newItem.complete();
}

function scrapePractical(doc, url){
	
}

function scrape(doc, url) {
	var namespace = doc.documentElement.namespaceURI;
    var nsResolver = namespace ? function(prefix) {
	if (prefix == 'x') return namespace; else return null;
	} : null;

	if (url.includes('/DMS-')) {
		return scrapeMerkurstab(doc, url);
	} else if (url.includes('/PRA-')) {
		return scrapePractical(doc, url);
	}
}
