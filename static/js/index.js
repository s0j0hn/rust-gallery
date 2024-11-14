import axios from "https://cdnjs.cloudflare.com/ajax/libs/axios/1.7.7/esm/axios.js"

function assignTagsFolder(folder_name, tags) {
    let existing_tags = tags.replace(/[\[\]]/g, "").split(",").map(item => item.trim())

    let prompt_tags = prompt(`(Separate by comma "tag , tag") - Please add your tag:`, "");
    if (prompt_tags == null || !prompt_tags) {
        console.log("Adding tags cancelled");
    } else {
        let data = {
            folder_name,
            tags: prompt_tags.trim().split(",")
        }
        axios.post('/tags/assign/folder', data, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(function (response) {
                // handle success
                console.log(response);
            })
            .catch(function (error) {
                // handle error
                console.log(error.message);
            })
            .finally(function () {
                // always executed
            });
    }
}

window.assignTagsFolder = assignTagsFolder;