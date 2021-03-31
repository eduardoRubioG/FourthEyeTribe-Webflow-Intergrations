var excel_data;
var url = $(".search-file-link a")[0].href;
var column_classes = "w-col w-col-3 w-col-small-3 w-col-tiny-3";
var excel_keys = {};

document.addEventListener("DOMContentLoaded", function (event) {
  $("#Search-form").on("keypress", function (e) {
    if (e.which === 13) {
      document.getElementById("Search-button").click();
      return false;
    }
    return true;
  });

  $.ajaxTransport("+binary", function (options, originalOptions, jqXHR) {
    // check for conditions and support for blob / arraybuffer response type
    if (
      window.FormData &&
      ((options.dataType && options.dataType == "binary") ||
        (options.data &&
          ((window.ArrayBuffer && options.data instanceof ArrayBuffer) ||
            (window.Blob && options.data instanceof Blob))))
    ) {
      return {
        // create new XMLHttpRequest
        send: function (headers, callback) {
          // setup all variables
          var xhr = new XMLHttpRequest(),
            url = options.url,
            type = options.type,
            async = options.async || true,
            // blob or arraybuffer. Default is blob
            dataType = options.responseType || "blob",
            data = options.data || null,
            username = options.username || null,
            password = options.password || null;

          xhr.addEventListener("load", function () {
            var data = {};
            data[options.dataType] = xhr.response;
            // make callback and send data
            callback(
              xhr.status,
              xhr.statusText,
              data,
              xhr.getAllResponseHeaders()
            );
          });

          xhr.open(type, url, async, username, password);

          // setup custom headers
          for (var i in headers) {
            xhr.setRequestHeader(i, headers[i]);
          }

          xhr.responseType = dataType;
          xhr.send(data);
        },
        abort: function () {
          jqXHR.abort();
        },
      };
    }
  });

  $.ajax({
    url: url,
    crossDomain: true,
    processData: false,
    dataType: "binary",
    success: function (data) {
      var file = data;
      var reader = new FileReader();
      reader.onload = function (e) {
        var data = e.target.result;
        var workbook = XLSX.read(data, { type: "binary" });
        var worksheet_raw = workbook.Sheets[workbook.SheetNames[0]];
        var worksheet = XLSX.utils.sheet_to_json(worksheet_raw);
        excel_data = worksheet;
        var select = document.getElementById("Search-Select");
        var i;
        var states = [];
        var theKeys = Object.getOwnPropertyNames(worksheet[0]);
        theKeys.forEach(function (key) {
          excel_keys[key.toLowerCase()] = key;
        });

        for (i = 0; i < worksheet.length; i++) {
          if (
            worksheet[i][excel_keys["state"]] !== "" &&
            worksheet[i][excel_keys["state"]] !== undefined &&
            states.indexOf(worksheet[i][excel_keys["state"]]) === -1
          ) {
            states.push(worksheet[i][excel_keys["state"]]);
          }
        }
        states.sort();
        for (i = 0; i < states.length; i++) {
          var option = document.createElement("option");
          option.text = states[i];
          option.value = states[i];
          select.add(option);
        }
      };
      reader.readAsBinaryString(file);
    },
  });

  // this function changes the DOM to make the buttons visible for
  // whatever setting you're going to be searching on
  document.getElementById("Method-Select").onchange = function () {
    if (this.value) {
      setSearchInputs(this.value);
    }
  };

  document
    .getElementById("Search-button")
    .addEventListener("click", function () {
      var i;
      // var method = document.querySelector('input[name="Search-method"]:checked')
      //   .value;
      var method =
        document.getElementById("Method-Select") &&
        document.getElementById("Method-Select").value
          ? document.getElementById("Method-Select").value
          : "None";
      var state = document.getElementById("Search-Select").value;
      var name = document.getElementById("Search-Input").value;
      var results_block = document.getElementById("Search-Results");
      var result =
        "<table class='rwd-table' id='school-table'><tr>" +
        // Adding a display: none column so we can ID selected table rows in order to get their data
        "<th style='display: none'>Id</th>" +
        "<th>Organization Name</th>" +
        "<th>State</th>" +
        "<th>Contact Details</th>" +
        "<th>Additional Details</th>" +
        "</tr>";
      var result_length = result.length;
      if (method === "All") {
        for (i = 0; i < excel_data.length; i++) {
          if (excel_data[i]) {
            result = result + generate_search_row(excel_data, i);
          }
        }
      }
      if (method === "State") {
        for (i = 0; i < excel_data.length; i++) {
          if (excel_data[i][excel_keys["state"]] === state) {
            result = result + generate_search_row(excel_data, i);
          }
        }
      }
      if (method === "Name") {
        // search by organization name
        for (i = 0; i < excel_data.length; i++) {
          if (
            excel_data[i][excel_keys["organization name"]]
              .toUpperCase()
              .includes(name.toUpperCase())
          ) {
            result = result + generate_search_row(excel_data, i);
          }
        }
      }

      if (result.length === result_length) {
        result =
          "<div style='padding: 1em 0; font-size: 1.5em; color: red; background: #fff;'>No matching records were found.</div>";
      } else {
        result = result + "</table>";
      }
      results_block.innerHTML = result;
      // Add listener for View Details button in table
      $(".school-table__view-btn").click(function () {
        var $row = $(this).closest("tr"); // Find the row
        var $text = $row.find(".school-table__row--id").text();
        const index = parseInt($text);
        const rowData = excel_data[index] ? excel_data[index] : undefined;

        // Hide school table
        document.getElementById("school-table").style.display = "none";
        document.getElementById("school-details").style.display = "block";

        // iterate through the object data keys
        let innerDetailsData = "";
        let headerData = "";
        let imgURL = "";
        if (rowData) {
          const nameKeys = ["Organization Name"];
          Object.keys(rowData).forEach((key) => {
            if (nameKeys.includes(key)) {
              headerData += `<div class="view-details-wrapper"><div class="view-details__value">${rowData[key]}</div></div>`;
            } 
            else if (key === "Photo: URL") {
              imgURL = rowData[key] || "";
            }
            else {
              innerDetailsData =
                innerDetailsData +
                `<div class="view-details-wrapper"><div class="view-details__header">${key}</div><div class="view-details__value">${rowData[key]}</div></div>`;
            }
          });
        }

        if (imgURL) {
          $("#courses-profile-image").attr("src", imgURL);
          $("#courses-profile-image").attr("alt", "courses profile image");
          if (document.getElementById("courses-profile-image")) {
            document.getElementById("courses-profile-image").style.display =
              "block";
          }
        }

        // Set button listener to return to previous state
        $("#return-to-school-search-btn").click(function () {
          document.getElementById("school-details").style.display = "none";
          document.getElementById("school-table").style.display = "block";
          if (document.getElementById("courses-profile-image")) {
            document.getElementById("courses-profile-image").style.display =
              "none";
          }
        });

        // Set the data
        if (headerData !== "") {
          $(".additionaldetails__name").html(headerData);
        } else {
          document.getElementsByClassName("details--name-row").style.display =
            "none";
        }
        $(".additionaldetails__content").html(innerDetailsData);
      });
    });

  function setSearchInputs(id) {
    switch (id) {
      case "All":
        setViewAllInputStyles();
        break;
      case "State":
        setSearchInputStyles("", true);
        break;
      case "Name":
        setSearchInputStyles("Type all or part of the name", false);
        break;
      default:
        defaultSearchInputs();
        break;
    }
  }

  function defaultSearchInputs() {
    document.getElementById("Search-Select").style.display = "none";
    document.getElementById("Search-Input").style.display = "none";
    document.getElementById("Search-button").style.display = "none";
    document.getElementById("Method-Select").val = "None";
  }

  /**
   *
   * @param {string} placeholder
   * @param {boolean} settingDropDown
   *
   * If settingDropDown is true, then set the dropdown. Placeholder param is not used here.
   * If false, then set the input field and set it's placeholder. If no placeholder is passed
   *   in then it will be set to empty
   */
  function setSearchInputStyles(placeholder = "", settingDropDown) {
    if (settingDropDown) {
      document.getElementById("Search-Select").style.display = "block";
      document.getElementById("Search-Input").style.display = "none";
      document.getElementById("Search-button").style.display = "inline-block";
    } else {
      document.getElementById("Search-Select").style.display = "none";
      document.getElementById("Search-Input").style.display = "block";
      document.getElementById("Search-button").style.display = "inline-block";
      $("#Search-Input").val("");
      $("#Search-Input").attr("placeholder", placeholder);
    }
  }

  function setViewAllInputStyles() {
    document.getElementById("Search-Select").style.display = "none";
    document.getElementById("Search-Input").style.display = "none";
    document.getElementById("Search-button").style.display = "inline-block";
  }

  function generate_search_row(excel_data, i) {
    var theKeys = Object.getOwnPropertyNames(excel_data[i]);
    excel_keys = {};
    theKeys.forEach(function (key) {
      excel_keys[key.toLowerCase()] = key;
    });

    var name =
      excel_data[i][excel_keys["organization name"]] === undefined
        ? ""
        : excel_data[i][excel_keys["organization name"]];
    var state =
      excel_data[i][excel_keys["state"]] === undefined
        ? ""
        : excel_data[i][excel_keys["state"]];
    var contact =
      excel_data[i][excel_keys["contact details"]] === undefined
        ? ""
        : excel_data[i][excel_keys["contact details"]];

    return (
      "<tr>" +
      "<td class='school-table__row--id' style='display: none'>" +
      i +
      "</td>" +
      "<td data-th='Name'>" +
      "<div class='truncate'>" +
      name +
      "</div>" +
      "</td>" +
      "<td data-th='State'>" +
      state +
      "</td>" +
      "<td data-th='Contact' class='truncate'>" +
      contact +
      "</td>" +
      "<td data-th='Additional Details'><button type='button' class='school-table__view-btn'>View</button></td>" +
      "</tr>"
    );
  }
});
