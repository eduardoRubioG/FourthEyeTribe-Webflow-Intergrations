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

  // // this function changes the DOM to make the buttons visible for
  // // whatever setting you're going to be searching on
  document.getElementById("Method-Select").onchange = function () {
    if (this.value) {
      setSearchInputs(this.value);
    }
  };

  document
    .getElementById("Search-button")
    .addEventListener("click", function () {
      var i;
      // var method = document.querySelector('input[name="Search-method"]:checked').value;
      var method =
        document.getElementById("Method-Select") &&
        document.getElementById("Method-Select").value
          ? document.getElementById("Method-Select").value
          : "None";
      var state = document.getElementById("Search-Select").value;
      var name = document.getElementById("Search-Input").value;
      var results_block = document.getElementById("Search-Results");
      var result =
        "<table class='rwd-table' id='doctor-table'><tr>" +
        // Adding a display: none column so we can ID selected table rows in order to get their data
        "<th style='display: none'>Id</th>" +
        "<th>" +
        "<div class='results-table__name-col'>" +
        "Name" +
        "<button class='alpha-sort-btn' id='doctor-table-sort'>" +
        "<svg viewBox='0 0 24 24' fill='#94181e' width='20px' height='20px'><path d='M0 0h24v24H0z' fill='none'/><path d='M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z'/></svg>" +
        "</button>" +
        "</div>" +
        "</th>" +
        "<th>Address</th>" +
        "<th>Phone</th>" +
        "<th>E-mail</th>" +
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
          if (
            excel_data[i][excel_keys["state"]] === state ||
            excel_data[i][excel_keys["address: state"]] === state
          ) {
            result = result + generate_search_row(excel_data, i);
          }
        }
      }
      if (method === "Last Name") {
        for (i = 0; i < excel_data.length; i++) {
          let lastName =
            excel_data[i] &&
            excel_data[i][excel_keys["name: last"]] &&
            excel_data[i][excel_keys["name: last"]].toString().toUpperCase()
              ? excel_data[i][excel_keys["name: last"]].toString().toUpperCase()
              : undefined;
          if (!lastName) {
            lastName =
              excel_data[i] &&
              excel_data[i][excel_keys["last name"]] &&
              excel_data[i][excel_keys["last name"]].toString().toUpperCase()
                ? excel_data[i][excel_keys["last name"]]
                    .toString()
                    .toUpperCase()
                : undefined;
          }
          if (lastName && lastName.includes(name.toUpperCase())) {
            result = result + generate_search_row(excel_data, i);
          }
        }
      }
      if (method === "First Name") {
        // search by first name
        for (i = 0; i < excel_data.length; i++) {
          let firstName =
            excel_data[i] &&
            excel_data[i][excel_keys["name: first"]] &&
            excel_data[i][excel_keys["name: first"]].toString().toUpperCase()
              ? excel_data[i][excel_keys["name: first"]]
                  .toString()
                  .toUpperCase()
              : undefined;
          if (!firstName) {
            firstName =
              excel_data[i] &&
              excel_data[i][excel_keys["first name"]] &&
              excel_data[i][excel_keys["first name"]].toString().toUpperCase()
                ? excel_data[i][excel_keys["first name"]]
                    .toString()
                    .toUpperCase()
                : undefined;
          }
          if (firstName && firstName.includes(name.toUpperCase())) {
            result = result + generate_search_row(excel_data, i);
          }
        }
      }
      if (method === "Zip") {
        // Search by ZIP
        for (i = 0; i < excel_data.length; i++) {
          var zip =
            excel_data[i] &&
            excel_data[i][excel_keys["zip code"]] &&
            excel_data[i][excel_keys["zip code"]].toString().toUpperCase()
              ? excel_data[i][excel_keys["zip code"]].toString().toUpperCase()
              : undefined;
          if (!zip) {
            zip =
              excel_data[i] &&
              excel_data[i][excel_keys["address: zip"]] &&
              excel_data[i][excel_keys["address: zip"]].toString().toUpperCase()
                ? excel_data[i][excel_keys["address: zip"]]
                    .toString()
                    .toUpperCase()
                : undefined;
          }
          if (zip && zip.includes(name.toUpperCase())) {
            result = result + generate_search_row(excel_data, i);
          }
        }
      }

      if (method === "Speciality") {
        // Search by speciality
        for (i = 0; i < excel_data.length; i++) {
          var speciality =
            excel_data[i] &&
            excel_data[i][excel_keys["speciality"]] &&
            excel_data[i][excel_keys["speciality"]].toString().toUpperCase()
              ? excel_data[i][excel_keys["speciality"]].toString().toUpperCase()
              : undefined;
          if (speciality && speciality.includes(name.toUpperCase())) {
            result = result + generate_search_row(excel_data, i);
          }
        }
      }

      if (method === "Degree") {
        // Search by degrees / acceditations
        for (i = 0; i < excel_data.length; i++) {
          var speciality =
            excel_data[i] &&
            excel_data[i][excel_keys["degrees/accreditation"]] &&
            excel_data[i][excel_keys["degrees/accreditation"]]
              .toString()
              .toUpperCase()
              ? excel_data[i][excel_keys["degrees/accreditation"]]
                  .toString()
                  .toUpperCase()
              : undefined;
          if (speciality && speciality.includes(name.toUpperCase())) {
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
      $(".doctor-table__view-btn").click(function () {
        var $row = $(this).closest("tr"); // Find the row
        var $text = $row.find(".doctor-table__row--id").text();
        const index = parseInt($text);
        const rowData = excel_data[index] ? excel_data[index] : undefined;

        // Hide doctor table
        document.getElementById("doctor-table").style.display = "none";
        document.getElementById("doctor-details").style.display = "block";

        // iterate through the object data keys
        let innerDetailsData = "";
        let nameCompound = "";
        let imgURL = "";
        if (rowData) {
          const nameKeys = [
            "Title",
            "Name",
            "Last Name",
            "Name: Title",
            "Name: First",
            "Name: Last",
          ];
          Object.keys(rowData).forEach((key) => {
            if (nameKeys.includes(key)) {
              nameCompound = nameCompound + rowData[key] + " ";
            } else if (key === "Photo: URL") {
              imgURL = rowData[key] || "";
            } else {
              innerDetailsData =
                innerDetailsData +
                `<div class="view-details-wrapper"><div class="view-details__header">${key}</div><div class="view-details__value">${rowData[key]}</div></div>`;
            }
          });
        }

        if (imgURL) {
          $("#doctor-profile-image").attr("src", imgURL);
          $("#doctor-profile-image").attr("alt", "doctor profile image");
          if (document.getElementById("doctor-profile-image")) {
            document.getElementById("doctor-profile-image").style.display =
              "block";
          }
        }

        // Set button listener to return to previous state
        $("#return-to-doctor-search-btn").click(function () {
          document.getElementById("doctor-details").style.display = "none";
          document.getElementById("doctor-table").style.display = "block";
          if (document.getElementById("doctor-profile-image")) {
            document.getElementById("doctor-profile-image").style.display =
              "none";
          }
        });

        // Set the data
        if (nameCompound !== "") {
          $(".additionaldetails__name").html(nameCompound);
        }
        $(".additionaldetails__content").html(innerDetailsData);
      });
    });

  // this function changes the DOM to make the buttons visible for
  // whatever setting you're going to be searching on
  document.getElementById("Method-Select").onchange = function () {
    if (this.value) {
      setSearchInputs(this.value);
    }
  };

  // Alphabetical Sorting toggle (by Name column)
  var alphaToggle = true;
  $(document.body).on("click", "#doctor-table-sort", function () {
    var filterTable, rows, sorted, i, x, y, sortFlag;
    filterTable = document.querySelector(".rwd-table");
    sorted = true;
    if (alphaToggle) {
      while (sorted) {
        sorted = false;
        rows = filterTable.rows;
        for (i = 1; i < rows.length - 1; i++) {
          sortFlag = false;
          x = rows[i].getElementsByTagName("TD")[1];
          y = rows[i + 1].getElementsByTagName("TD")[1];
          if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
            sortFlag = true;
            break;
          }
        }
        if (sortFlag) {
          rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
          sorted = true;
        }
      }
      alphaToggle = false;
    } else {
      while (sorted) {
        sorted = false;
        rows = filterTable.rows;
        for (i = 1; i < rows.length - 1; i++) {
          sortFlag = false;
          x = rows[i].getElementsByTagName("TD")[1];
          y = rows[i + 1].getElementsByTagName("TD")[1];
          if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
            sortFlag = true;
            break;
          }
        }
        if (sortFlag) {
          rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
          sorted = true;
        }
      }
      alphaToggle = true;
    }
  });

  function setSearchInputs(id) {
    switch (id) {
      case "All":
        setViewAllInputStyles();
        break;
      case "State":
        setSearchInputStyles("", true);
        break;
      case "Last Name":
        setSearchInputStyles("Type all or part of the last name", false);
        break;
      case "First Name":
        setSearchInputStyles("Type all or part of the first name", false);
        break;
      case "Zip":
        setSearchInputStyles("Type all or part of the zip code", false);
        break;
      case "Speciality":
        setSearchInputStyles("Type all or part of a speciality", false);
        break;
      case "Degree":
        setSearchInputStyles(
          "Type all or part of a degrees/accreditations",
          false
        );
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
    var title =
      excel_data[i][excel_keys["title"]] ||
      excel_data[i][excel_keys["name: title"]] === undefined
        ? ""
        : excel_data[i][excel_keys["title"]] ||
          excel_data[i][excel_keys["name: title"]];
    var name =
      excel_data[i][excel_keys["name"]] ||
      excel_data[i][excel_keys["name: first"]] === undefined
        ? ""
        : excel_data[i][excel_keys["name"]] ||
          excel_data[i][excel_keys["name: first"]];
    var lastname =
      excel_data[i][excel_keys["last name"]] ||
      excel_data[i][excel_keys["name: last"]] === undefined
        ? ""
        : excel_data[i][excel_keys["last name"]] ||
          excel_data[i][excel_keys["name: last"]];
    var address =
      excel_data[i][excel_keys["address"]] ||
      excel_data[i][excel_keys["address: street 1"]] === undefined
        ? ""
        : excel_data[i][excel_keys["address"]] ||
          excel_data[i][excel_keys["address: street 1"]];
    var apartment =
      excel_data[i][excel_keys["apartment"]] ||
      excel_data[i][excel_keys["address: street 2"]] === undefined
        ? ""
        : excel_data[i][excel_keys["second address"]] ||
          excel_data[i][excel_keys["address: street 2"]];
    var city =
      excel_data[i][excel_keys["city"]] ||
      excel_data[i][excel_keys["address: city"]] === undefined
        ? ""
        : excel_data[i][excel_keys["city"]] ||
          excel_data[i][excel_keys["address: city"]];
    var state = excel_data[i][excel_keys["state"]] || undefined;  
    var postal =
      excel_data[i][excel_keys["postal"]] ||
      excel_data[i][excel_keys["address: zip"]] === undefined
        ? ""
        : excel_data[i][excel_keys["postal"]] ||
          excel_data[i][excel_keys["address: zip"]];
    var mail =
      excel_data[i][excel_keys["email"]] === undefined
        ? ""
        : excel_data[i][excel_keys["email"]];
    var phoneFax =
      excel_data[i][excel_keys["phone/fax"]] ||
      excel_data[i][excel_keys["phone number"]] === undefined
        ? ""
        : excel_data[i][excel_keys["phone/fax"]] ||
          excel_data[i][excel_keys["phone number"]];

    const serializedAddress = buildAddressString(
      address || null,
      apartment || null,
      city || null,
      state || null,
      postal || null
    );

    return (
      "<tr>" +
      "<td class='doctor-table__row--id' style='display: none'>" +
      i +
      "</td>" +
      "<td data-th='Name'>" +
      title +
      " " +
      name +
      " " +
      lastname +
      "</td>" +
      "<td data-th='Address'>" +
      serializedAddress + 
      "</td>" +
      "<td data-th='Phone'>" +
      phoneFax +
      "</td>" +
      "<td data-th='E-mail'>" +
      mail +
      "</td>" +
      "<td data-th='Additional Details'><button type='button' class='doctor-table__view-btn'>View</button></td>" +
      "</tr>"
    );
  }

  function buildAddressString(street, secondStreet, city, state, zip) {
    let address = "";
    address += street ? street + ", " : "";
    address += secondStreet ? secondStreet + ", " : "";
    address += city ? city + " " : "";
    address += state ? state + ", " : "";
    address += zip ? zip : "";
    return address;
  }
});
