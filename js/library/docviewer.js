//Copyright (C) 2025 Guillaume P. Hérault (https://github.com/LucasNTT/LucasNTT.github.io)
//
//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal
//in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following condition:
//
//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function DocViewer() { };
	DocViewer.Data = null;
	DocViewer.tags = [];
	DocViewer.input = null;
	DocViewer.administrator = false;

	DocViewer.Init = function (data) {

		var img=document.createElement('img');
		img.src='https://by3302files.storage.live.com/y4pw0T1KLoHm2CPg9W1v4PDjdThOZ7Y6zgiNBdqAjwYXE8M6bpV1YYMr96FlsUYKSpEAuktYzQ8ktC9mb-8BrCl3BFcC1ivQ4KHWjOJtJib2jv9VxJTbrKtlKyAHur5o9kZCuwqQlBb7A1Whwdjl1TPid5six9Utt7plQVcP7KNHGmqSD-gSxK7R5UBlvlax_tKoJ7gT_Y7hJaHsWoYhZ5QvkZhl4G9Zf7gI7RUiPObvIc/test.jpg?psid=1&width=73&height=73&cropMode=center';
		img.onload=function(){DocViewer.administrator = true; DocViewer.Refresh()};
		img.onerror=function(){DocViewer.administrator = false};
		img.style.display='none';
		
		DocViewer.input = $("<input/>", {
		  type: "text",
		  id: "form-tags-1"
		});
		$('#inputtag').append(DocViewer.input);
		
		DocViewer.input.tagsInput({
			minChars: 2,
			delimiter: ' ',
			onAddTag:function(elem, tag) {
				DocViewer.OnTagChanged(elem.value);
			},
			onRemoveTag:function(elem, tag) {
				DocViewer.OnTagChanged(elem.value);
			}
		});
		
		var tags = getParameterByName("tags");
		if (tags)
		{
			DocViewer.input.importTags(tags);
			DocViewer.OnTagChanged(tags);
		}
		
		$.ajax({
				url: "data/documents.json",
				dataType: "json",
				success: function(response) {
				    DocViewer.SetData(response.docs);
					DocViewer.Refresh();
				}
			});	

	};
	
	DocViewer.SetData = function (data) {
		DocViewer.Data = data;
	};

	DocViewer.OnTagChanged = function (tags) {
		if (tags) {
			DocViewer.tags = tags.split(' ');
		}
		else {
			DocViewer.tags = [];
		}
		DocViewer.Refresh();
	};

	DocViewer.Refresh = function () {
		var title = 'No document yet in this library';
		if (DocViewer.Data && DocViewer.Data.length > 0){
			var html = "";
			var docCount = 0;
			for (var i = 0; i < DocViewer.Data.length; i++) {
				var included = true;
				for (var j = 0; j < DocViewer.tags.length; j++) {
                    included &= (" " + DocViewer.Data[i].Tags.toUpperCase() + " ").indexOf(" " + DocViewer.tags[j].toUpperCase() + " ") !== -1;
				}

				if (included) {
                    html += '<li>' + DocViewer.FormatLink(i, 'Open') + '<img src="images/' + DocViewer.Data[i].Type + '.png" alt="" /></a>';
					html += '<p>'
					if (DocViewer.Data[i].Authors.length < 6) {
						for (var k = 0; k < DocViewer.Data[i].Authors.length; k++) {
							html += '<a href="?tags=' + DocViewer.Data[i].Authors[k].Last_Name + '">' + DocViewer.Data[i].Authors[k].Last_Name + '</a> ';
						}
					}
					else {
						html += '<a href="?tags=' + DocViewer.Data[i].Authors[0].Last_Name + '">' + DocViewer.Data[i].Authors[0].Last_Name + '</a> et al. ';					
					}
					html += "- " + DocViewer.Data[i].Title;
					html += '</p>';
					html += '<span>Tags:&emsp;&nbsp;';
					var docTags = DocViewer.Data[i].Tags.split(' ');
					for (var k = 0; k < docTags.length; k++) {
						html += '<a href="?tags=' + docTags[k] + '">' + docTags[k] + '</a>&ensp;';
					}
					html += '</span>';
					html += '<span>Links:&emsp;';
					//html += DocViewer.FormatLink(i, 'Open') + (DocViewer.administrator? 'PDF':'Preview') + '</a>&emsp;';
                    if (DocViewer.Data[i].Type != 'link') {
                        html += DocViewer.FormatLink(i, 'GoogleScholar') + 'Google Scholar</a>&emsp;';
                    }
                    else {
                        html += DocViewer.FormatLink(i, 'Open') + 'Hyperlink</a>&emsp;';
                    }
					html += '<a href="?tags=' + DocViewer.Data[i].Code + '">Permalink</a>&emsp;';
					html += '</span>';
					html += '</li>';
					docCount++;
				}
			}
			if (docCount > 0) {
				title = docCount + " document" + ((docCount == 1)? "": "s");
				if (docCount != DocViewer.Data.length) {
					title += " (out of " + DocViewer.Data.length + ")";
				}
			}
			document.getElementById('doc-list').innerHTML = html;
		}
		$("#doc-count").text(title)
	};

    DocViewer.GetCondensedAuthors = function (doc) {
        var result = [];
        if (doc.Authors.length < 6)
        {
            for (var i = 0; i < doc.Authors.length; i++) {
                result[result.length] = doc.Authors[i].Last_Name;
            }
        }
        else
        {
            result[result.length] = doc.Authors[0].Last_Name;
            result[result.length] = 'et al.';
        }
        return result.join(' ');
    }

    DocViewer.getFileName = function (doc) {
        var result = '';
        if (doc.Code) {
            result += '[' + doc.Code + ']';
        }
        if (doc.Authors.length > 0) {
            if (result) result += ' ';
            result += DocViewer.GetCondensedAuthors(doc);
        }
        if (doc.Year) {
            if (result) result += ' - ';
            result += doc.Year;
        }
        if (doc.Title) {
            if (result) result += ' - ';
            result += doc.Title;
        }
        return result;
    };


    DocViewer.Open = function (code) {
        var doc = undefined;
        for (var i = 0; i < DocViewer.Data.length; i++) {
            if (DocViewer.Data[i].Code == code) {
                doc = DocViewer.Data[i];
                break;
            }
        }
        if (doc != undefined) {
            if (doc.Url) {
                window.open(doc.Url, '_blank');
            }
            else {
                if (DocViewer.administrator) {
                    window.open('http://localhost:8000/' + encodeURI(DocViewer.getFileName(doc)) + '.pdf', '_blank');
                }
                else {
                    this.GoogleScholar(code);
                }
            }
        }
    };

	DocViewer.GoogleScholar = function (code) {
		var doc = DocViewer.GetDoc(code);
		if (doc) {
			var url = 'https://scholar.google.com/scholar?q=';
			if (doc.Authors.length > 0) {
                url += 'author%3A%22' + (doc.Authors[0].Last_Name.replace('\u00FC', 'ue')) + '%22+';
			}
            url += '%22' + doc.Title.replace('+','%2B').replace(/ /g, '+') + '%22';
			window.open(url);
		}
	};

	DocViewer.GetDoc = function (Code) {
		for (var i = 0; i < DocViewer.Data.length; i++) {
			if (DocViewer.Data[i].Code == Code) { return DocViewer.Data[i]; }
		}
		return null;
	};
	
	DocViewer.FormatLink = function (index, fn) {
		return '<a onclick="DocViewer.' + fn + '(&quot;' + DocViewer.Data[index].Code + '&quot;); return false;" href="#">';
	};
	
	DocViewer.Permalink = function () {
		window.open('?tags=' + DocViewer.tags.join('%20'),'_self');
	};


(function($) {
		DocViewer.Init();
})(jQuery);
