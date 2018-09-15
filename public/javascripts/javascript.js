
var changed="success";
var cellChanged="warning";
var deleted="danger";
var IGNORE_PRIMARY_KEY = 0 ;
var globalColumnSet = [];
var globalNumericFieldSet = [];
var globalOptionalFieldSet = [];
var globalUrl = [];
var globalGetUrl = [];
var globalOptions = [];
var globalRefresh = [];
var globalLastDataGet = [];



function frigSelectDropDownSearch() {
    // without this we dont get the search box
    $('.defaultpicker').selectpicker({
             style: 'btn-default',
             size: 4,
             container: 'body'
    });
    $('.defaultpicker').attr('contenteditable','false');

}

function buildHtmlTable(tableUrl,getUrl,selector,divSelector,newModal) {
    globalUrl[selector] = tableUrl
    globalGetUrl[selector] = getUrl
    $.ajax({
         type : 'GET',
         contentType : "application/json; charset=utf-8",
         url : globalGetUrl[selector],
         success : function(data) {
              globalLastDataGet[selector]=data;
              makeTable(selector,divSelector,data,newModal)
              frigSelectDropDownSearch();
         },
         error : function(response) {
            alert("error " + response.statusText + ":"+ response.status+" - " +response.responseText)
            }
    });
}

function makeTable(selector,divSelector, myList,newModal) {

  $(selector).empty();
  var columns = addAllColumnHeaders(myList, selector,divSelector,newModal);
  $(selector).append('<tbody class="fixed-tbody"/>');

  for (var i = 0; i < myList.length; i++) {
    if ( myList[i][columns[0]] >= 0 ) {
        var row$ = $('<tr class="fixed-tr"/>');
        for (var colIndex = 0; colIndex < columns.length; colIndex++) {
            var cellValue = myList[i][columns[colIndex]];
            if (cellValue == null) cellValue = "";
            if (typeof window["DRAW"+columns[colIndex]]  === "function") {
                cellValue = window[ "DRAW"+columns[colIndex] ](cellValue);
            }

            if ( colIndex > IGNORE_PRIMARY_KEY ) {
              row$.append('<td contenteditable="true" class="editable" data-orig="'+cellValue+'">'+cellValue+'</td>');
            } else {
              row$.append('<td>'+cellValue+'</td>');
            }
          }
      row$.append('<td  width="30px" id="action"><a onClick="deleteRow(this)" href="#"><span class="glyphicon glyphicon-remove"></span></a></td>');
      $(selector).append(row$);
    }
  }

  $("td.editable").blur(function () {
        checkCellAfterEdit($(this));
    } );

}

function addAllColumnHeaders(myList, selector,divSelector,newModal) {

  columnSet=[];
  if ( myList.length == 0 || selector in globalColumnSet ) {
    columnSet = globalColumnSet[selector];
  } else {
    for (var i = 0; i < myList.length && i < 1 ; i++) {
        var rowHash = myList[i];
        for (var key in rowHash) {
            columnSet.push(key);
        }
    }
  }

  var headerTr$ = $('<thead class="fixed-thead"/>');
  var colCounter=0
  for (var k in columnSet) {
      var key = columnSet[k];
      var icon = '<p class="btn-sort"><span class="glyphicon glyphicon-sort"/> ' + key +' </p>';
      var button = '<a href="#" onClick="sortTable(\''+selector+'\',this,'+colCounter+')" class="btn btn-sort table-header" role="button">'+icon+'</a>' ;
      headerTr$.append($('<th/>').html(button));
      colCounter=colCounter+1;
  }

  headerTr$.append('<th width="30px" />');
  if ( $(divSelector).find("span").length == 0 ) {
    var addRow=""
    if ( typeof globalOptions[selector] == "undefined" || ! globalOptions[selector].includes("addrow=disable") ) {
       var addRow = '<a href="#" onClick="addRow(\''+selector+'\')"><span class="glyphicon glyphicon-plus largeglyphicon"  ></span></a>'
    }
    $(divSelector).html('<span>'+
                    addRow +
                    '<a href="#" onClick="confirmDelete(\''+selector+'\')"><span class="glyphicon glyphicon-trash largeglyphicon" ></span></a>'+
                    '<a href="#" onClick="confirmUpdate(\''+selector+'\')"><span class="glyphicon glyphicon-ok largeglyphicon" ></span></a>' +
                    '<a href="#" onClick="refresh(\''+selector+'\',\''+divSelector+'\',\''+newModal+'\')"><span class="glyphicon glyphicon-refresh largeglyphicon" ></span></a>' +
                    '<button type="button" style="vertical-align: top" class="btn btn-primary" data-toggle="modal" data-target="'+newModal+'" >New</button>' +
                    '</span>' +
                    $(divSelector).html()
                    );
  }
  $(selector).append(headerTr$);
  if ( ! selector in globalColumnSet ) {
    globalColumnSet[selector] = columnSet
  }

  return columnSet;
}

function refresh(selector,divSelector,newModal) {
    tableUrl = globalGetUrl[selector] ;

    var refFn = globalRefresh[selector];

    if (typeof refFn  === "function") {
        refFn(tableUrl,selector,divSelector,newModal) ;
    } else {
        buildHtmlTable(tableUrl,tableUrl,selector,divSelector,newModal) ;
    }
}


function checkCellAfterEdit(diss) {
     var contents = $(diss).data("orig");
     //console.log("checkCellAfterEdit "+contents+"  "+$(diss).html());
     if (contents !=$(diss).html()){
        $(diss).addClass(cellChanged);
        $(diss).parent().addClass(changed);
        var row = $(diss).parent().find('#action').html('<a onClick="rollbackRow(this)" href="#"><span class="glyphicon glyphicon-refresh"></span></a>') ;
     } else {
        $(diss).removeClass(cellChanged);
        var changesExcludingThisOne= 0;
        $(diss).parent().find('td').each(function( index ) {
            if ( index > IGNORE_PRIMARY_KEY ) {
                var contents = $(diss).data("orig");
                if ( typeof contents != 'undefined' ) {
                    if (contents !=$(diss).html()){
                        changesExcludingThisOne=changesExcludingThisOne+1;
                    }
                }
            }
        });
        if ( changesExcludingThisOne == 0 ) {
            $(diss).parent().removeClass(changed);
            var row = $(diss).parent().find('#action').html('<a onClick="deleteRow(this)" href="#"><span class="glyphicon glyphicon-remove"></span></a>');
        }
     }
}

function rollbackRow(undoRef) {
    var row = $(undoRef).parent().parent() ;
    $(row).find('td').each(function( index ) {
        if ( index > IGNORE_PRIMARY_KEY ) {
            var contents = $(this).data("orig");
            $(this).html(contents);
            $(this).removeClass(cellChanged);
        }
    });
    row.removeClass(changed);
    row.find('#action').html('<a onClick="deleteRow(this)" href="#"><span class="glyphicon glyphicon-remove"></span></a>');

    frigSelectDropDownSearch();
}


function addRow(table) {
    var clonedRow = $(table+' tbody tr:first').clone();
    clonedRow.addClass(changed);
    //clonedRow.find('td').html('').addClass(cellChanged);
            clonedRow.find('td:first').html('');
            clonedRow.find('td').each(function( index ) {
                $(this).addClass(cellChanged);
                if ( typeof $(this).data("orig") != 'undefined' ) {
                    $(this).attr('data-orig','');
                    $(this).html('' );
                }
            });
    clonedRow.find('#action').html('<a onClick="deleteRow(this)" href="#"><span class="glyphicon glyphicon-remove"></span></a>');
    $(table+' tbody').prepend(clonedRow);
}
function deleteRow(trashRef) {
    var row = $(trashRef).parent().parent() ;
    if ( row.hasClass(deleted)  == true )  {
        row.removeClass(deleted);
    } else {
        row.addClass(deleted);
    }
}
function confirmDelete(table) {
    var justUrl = globalUrl[table].split("?")[0]
    $(table+' .'+deleted).each(function() {
        var row=this
        var primaryKey = $(row).find('td:first').html()
        if ( primaryKey != "" ) {
            var csrf = $('input[name=csrfToken]').val()
            $.ajax({
                 type : "DELETE",
                 headers: {
                              'Csrf-Token':csrf
                 } ,
                 contentType : "application/json; charset=utf-8",
                 url : justUrl+'/'+primaryKey,
                 success : function(data) {
                    $(row).remove();
                 },
                 error : function(response) {
                    alert("error " + response.statusText + ":"+ response.status+" - " +response.responseText)
                 }
                 });
        } else {
            $(row).remove() }
        }
    );
}
function confirmUpdate(table) {
    columnSet = globalColumnSet[table]
    optionalSet=globalOptionalFieldSet[table]
    numericSet=globalNumericFieldSet[table]

    $(table+' .'+changed).each(function() {
            var json = {};
            $(this).find('#action').html('<a onClick="deleteRow(this)" href="#"><span class="glyphicon glyphicon-remove"></span></a>');
            var primaryKey = $(this).find('td:first').html()
            json = {};
            var doUpdate="POST";
            if ( primaryKey == "" ) {
                json[ columnSet[0]] = -1;
            } else {
                json[ columnSet[0]] = parseInt( primaryKey );
                doUpdate="PUT";
            }
            for( i = 2 ; i <= columnSet.length ; i++ ) {
                var val  = $(this).find("td:nth-child("+i+")").html() ;
                var name = columnSet[i-1];

                if (typeof window["GET"+name]  === "function") {
                    val = window[ "GET"+name ]($(this).find("td:nth-child("+i+")"));
                }

                if ( ! ( typeof optionalSet != 'undefined' && optionalSet.indexOf(name) != -1  && val == '' ) )  {
                    if ( numericSet.indexOf(name) != -1 ) {
                        json[name] = +val;
                    } else {
                        json[name] = val;
                    }
                }
            }
            console.log("insert "+ JSON.stringify(json ) ) ;
            var csrf = $('input[name=csrfToken]').val()
            var trRow=this;
            $.ajax({
                  type : doUpdate,
                  headers: {
                      'Csrf-Token':csrf
                  } ,
                  contentType : "application/json; charset=utf-8",
                  data : JSON.stringify(json),
                  url : globalUrl[table],
                  success : function(data) {
                    console.log(data);
                    updateRowUpdateWorked(trRow,data[ columnSet[0]] );
                  },
                  error : function(response) {
                      alert("error " + response.statusText + ":"+ response.status+" - " +response.responseText)
                  }
            });
            }
    ) ;
}
function formNew(tableUrl,selector,divSelector,newModal) {
    columnSet=globalColumnSet[selector]
    optionalSet=globalOptionalFieldSet[selector]
    numericSet=globalNumericFieldSet[selector]
    var json = {};
    for(col in columnSet) {
        var name = columnSet[col];
        var val = $('#'+columnSet[col]).val();
        if (typeof window["GET"+name]  === "function") {
            val = window[ "GET"+name ]( $(newModal) );
        }
        if ( ! ( typeof optionalSet != 'undefined' && optionalSet.indexOf(name) != -1  && val == '' ) )  {
            if ( numericSet.indexOf(name) != -1 ) {
                json[columnSet[col]] = +val;
            } else {
                json[columnSet[col]] = val;
            }
        }
    }

    console.log( "NEW "+JSON.stringify(json));
    var csrf = $('input[name=csrfToken]').val()
    $.ajax({
       type : "POST",
       headers: { 'Csrf-Token':csrf } ,
       contentType : "application/json; charset=utf-8",
       data : JSON.stringify(json),
       url : /* globalUrl[selector]*/ tableUrl,
       success : function(json) {
           var clonedRow = $(selector+' tbody tr:first').clone();

           buildHtmlTable(globalUrl[selector],globalGetUrl[selector],selector,divSelector,newModal) ;

           clonedRow.find('#action').html('<a onClick="deleteRow(this)" href="#"><span class="glyphicon glyphicon-remove"></span></a>');
           $(selector+' tbody').prepend(clonedRow);
           for(col in columnSet) {
                 $('#'+columnSet[col]).val('');
           }
         }, error : function(response) {
               alert("error " + response.statusText + ":"+ response.status+" - " +response.responseText)
         }
    });

}
function updateRowUpdateWorked(diss,primaryKey) {
    $(diss).removeClass(changed);
    $(diss).find('td').each(function( index ) {
        if ( index == 0 ) {
            $(this).html(Number(primaryKey));
        }

        $(this).removeClass(cellChanged);
        if ( typeof $(this).data("orig") != 'undefined' ) {
            $(this).attr("data-orig",$(this).html() );
            $(this).data("orig",$(this).html() );
            $(this).blur(function () {
                checkCellAfterEdit($(this));
            } );
        }
    } ) ;
}


// https://www.w3schools.com/howto/howto_js_sort_table.asp
function sortTable(selector,header,n) {
  var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
  table = $(selector);
  switching = true;
  header.asc = !header.asc
  dir = "asc";
  if ( header.asc ) {
    dir = "desc" ;
  } else {
    dir = "asc" ;
  }
  while (switching) {

    switching = false;
    rows = table.find("TR");

    for (i = 0; i < (rows.length - 1); i++) {

      shouldSwitch = false;
      x = $(rows[i]).find("TD")[n];
      y = $(rows[i + 1]).find("TD")[n];

      if (dir == "asc") {
        if ( ! isNaN(x) &&  ! isNaN(y) ) {
            if ( parseInt( x.innerHTML.toLowerCase())  > parseInt( y.innerHTML.toLowerCase() ) )  {
                shouldSwitch= true;
                break;
            }
        } else if ( x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase() ) {
          shouldSwitch= true;
          break;
        }
      } else if (dir == "desc") {
        if ( ! isNaN(x) && ! isNaN(y) ) {
            if ( parseInt( x.innerHTML.toLowerCase())  < parseInt( y.innerHTML.toLowerCase() ) )  {
                shouldSwitch= true;
                break;
            }
        } else if ( x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase() ) {
          shouldSwitch= true;
          break;
        }
      }
    }
    if (shouldSwitch) {
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      switchcount ++;
    } else {
      if (switchcount == 0 && dir == "asc") {
        dir = "desc";
        switching = true;
      }
    }
  }
}

