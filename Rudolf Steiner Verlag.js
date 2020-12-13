{
	"translatorID": "f609c826-e337-488f-a547-43c48d4abcd4",
	"label": "Rudolf Steiner Verlag",
	"creator": "Christoph Holtermann",
	"target": "www.steinerverlag.com",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2020-12-13 00:32:29"
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

function check_if_detail_url(url) {
	// wenn es noch einen Unterpfad gibt, ist es eine Detailseite
	var re_url = /\/(rudolf-steiner-gesamtausgabe|taschenbuecher-aus-dem-gesamtwerk)\/.*\//;
	var is_detail_url = re_url.exec(url);
	return is_detail_url;
}

function detectWeb(doc, url) {
	// TODO: adjust the logic here
	var is_detail_url = check_if_detail_url();
	Z.debug(is_detail_url);
	if (is_detail_url) {
		Z.debug("book");
		return "book";
	}
	else if (getSearchResults(doc, true)) {
		Z.debug("multiple")
		return "multiple";
	}
	return false;
}

function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	// TODO: adjust the CSS selector
	var rows = doc.querySelectorAll('div[class="listing"]>div[class*="product--box"]');
	// >a[href*="/rudolf-steiner-gesamtausgabe"]
	// >div[class="product--info"]
	// Z.debug(rows);
	for (let row of rows) {
		//Z.debug(row);
		var anchor = row.querySelector('a[class="product--title"]');
		// TODO: check and maybe adjust
		let href = anchor.href;
		// TODO: check and maybe adjust
		let title = ZU.trimInternal(anchor.title);
		// Z.debug(href+" "+title);
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

function scrapeSteinerGA(doc, url){
	var newItem = new Zotero.Item("book");
	newItem.url = doc.location.href;
	Z.debug(newItem);
    
    var series = ZU.xpathText(doc, '//li[contains(@class, "entry-attribute-8")]/span[@class="entry--content"]');
	Z.debug("series: " + series);
	newItem.series = series;
	
	var volume = ZU.xpathText(doc, '//li[contains(@class, "entry-attribute-7")]/span[@class="entry--content"]');
	Z.debug("volume: " + volume);
	newItem.volume = volume;
    
    var title = ZU.xpathText(doc, '//div[@class="product--info"]//h1[@class="product--title"]');
	Z.debug("title: " + title);
	newItem.title = title;
    
    var note = ZU.xpathText(doc, '//li[contains(@class, "entry-attribute-5")]/span[@class="entry--content"]');
	Z.debug("note: " + note);
	newItem.extra = note;
	
	var edition = ZU.xpathText(doc, '//li[contains(@class, "entry-attribute-3")]/span[@class="entry--content"]');
	Z.debug("edition: " + edition);
	newItem.edition = edition;
    
    var authors = ZU.xpathText(doc, '//div[@class="product--info"]//div[@class="product--authors"]');
	authors = authors.split(",");
	Z.debug(authors);
    for (let author of authors) {
		Z.debug("author: " + author);
		newItem.creators.push(Zotero.Utilities.cleanAuthor(author, "author", false));
	}
	
	var pages = ZU.xpathText(doc, '//li[contains(concat(@class, " "), "entry-attribute-1 ")]/span[@class="entry--content"]');
	Z.debug("pages: " + pages);
	newItem.numPages = pages;
    
    var isbn = ZU.xpathText(doc, '//span[@itemprop="ean"]');
	Z.debug("isbn: " + isbn);
	newItem.ISBN = isbn;
    
    var year = ZU.xpathText(doc, '//li[contains(@class, "entry-attribute-2")]/span[@class="entry--content"]');
	Z.debug("year: " + year);
	newItem.date = year;
    
	var language = "DE";
	Z.debug("language: " + language);
	newItem.language = language;
	
	var publisher = "Rudolf Steiner Verlag";
	Z.debug("publisher: " + publisher);
	newItem.publisher = publisher;
	
	var abstract = ZU.xpathText(doc, '//div[@class="product--description"]');
    Z.debug("abstractNote: " + abstract);
    newItem.abstractNote = abstract;
	
	newItem.complete();
    return newItem;
}

function scrape(doc, url) {
	var namespace = doc.documentElement.namespaceURI;
    var nsResolver = namespace ? function(prefix) {
	if (prefix == 'x') return namespace; else return null;
	} : null;

	if (check_if_detail_url(url)) {
		return scrapeSteinerGA(doc, url);
	} else return null;
}
