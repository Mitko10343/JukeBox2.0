//whenever the document is loaded
/// <reference path="/public/javascripts/babylonjs/babylon.js" />
$(document).ready(function () {
    //check if babylon is supported by the browser
    if (BABYLON.Engine.isSupported()) {

        //get a reference of the canvas
        const canvas = document.getElementById('canvas');
        //prevent the page scrolling when ever the mouse wheel is scrolled inside the canvas
        $(canvas).on('onwheel', function (event) {
            event.preventDefault();
        });
        $(canvas).on('mousewheel', function (event) {
            event.preventDefault();
        });

        //array to store all decals
        let decals = [];

        //Create an instance of the babylon engine
        const engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});

        engine.displayLoadingUI();
        //Function that creates the scene to be rendered
        const createScene = function () {
            //disable offline support for gradle
            engine.enableOfflineSupport = false;
            //Create scene
            let scene = new BABYLON.Scene(engine);
            //configure the scene
            scene.clearColor = new BABYLON.Color3.White();

            //create a light for the scene
            //configure the color of the light to white
            const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 50, 0), scene);
            light.diffuseColor = new BABYLON.Color3.White();

            //create an arc rotate camera that will be rotating around the center
            const camera = new BABYLON.ArcRotateCamera("camera", BABYLON.Tools.ToRadians(270), BABYLON.Tools.ToRadians(90), 14.0, new BABYLON.Vector3(0, 5, 0), scene);
            camera.attachControl(canvas, true);

            const camera1 = new BABYLON.ArcRotateCamera("camera1", BABYLON.Tools.ToRadians(270), BABYLON.Tools.ToRadians(90), 14.0, new BABYLON.Vector3(0, 5, 0), scene);
            const camera2 = new BABYLON.ArcRotateCamera("camera2", BABYLON.Tools.ToRadians(360), BABYLON.Tools.ToRadians(90), 14.0, new BABYLON.Vector3(0, 5, 0), scene);
            const camera3 = new BABYLON.ArcRotateCamera("camera3", BABYLON.Tools.ToRadians(90), BABYLON.Tools.ToRadians(90), 14.0, new BABYLON.Vector3(0, 5, 0), scene);
            const camera4 = new BABYLON.ArcRotateCamera("camera4", BABYLON.Tools.ToRadians(180), BABYLON.Tools.ToRadians(90), 14.0, new BABYLON.Vector3(0, 5, 0), scene);


            //Configure limit for the camera zoom and rotation
            camera.lowerBetaLimit = 0.1;
            camera.upperBetaLimit = (Math.PI / 2) * 0.99;
            camera.lowerRadiusLimit = 10;

            //create a texture for the wooden floor in scene 1
           const ground_texture = new BABYLON.StandardMaterial('ground', scene);
            ground_texture.diffuseTexture = new BABYLON.Texture("../../models/textures/floor.jpg", scene);
            ground_texture.bumpTexture = new BABYLON.Texture("../../models/textures/floor_bump.jpg", scene);
            ground_texture.specularColor = new BABYLON.Color3.Black();
            ground_texture.diffuseTexture.uScale = 20.0;
            ground_texture.diffuseTexture.vScale = 20.0;
            ground_texture.bumpTexture.uScale = 20.0;
            ground_texture.bumpTexture.vScale = 20.0;

            //create a mesh for the wooden floor in scene 1 and attach the texture to it
            const ground = new BABYLON.Mesh.CreateGroundFromHeightMap("ground", "../../models/textures/floor_roughness.jpg", 500, 500, 200, 0, 0.5, scene, false);
            ground.material = ground_texture;


            //create a standard material for the model
            const material = new BABYLON.StandardMaterial("material", scene);
            //Remove reflection from the light source onto the material
            material.specularColor = new BABYLON.Color3.Black();
            //Set the material color to hite
            material.diffuseColor = new BABYLON.Color3.White();
            //Load the diffuse texture of the material and scale it on the U and V axis
            material.diffuseTexture = new BABYLON.Texture("../../models/textures/fabric_texture2.jpg", scene);
            material.diffuseTexture.uScale = 20.0;
            material.diffuseTexture.vScale = 20.0;
            //Load the bump texture of the material and scale it on the U and V axis
            material.bumpTexture = new BABYLON.Texture("../../models/textures/fabric_bump.jpg", scene);
            material.bumpTexture.uScale = 20.0;
            material.bumpTexture.vScale = 20.0;


            //render the mesh
            BABYLON.SceneLoader.ImportMesh("", "../../models/", "tshirt.babylon", scene, function (newMeshes) {
                let mesh = newMeshes[1];
                //Event listener that fires on mouse click
                scene.onPointerDown = function (evt, pickInfo) {
                    //ensure the left mouse button was clicked
                    if (evt.button !== 0)
                        return;

                    //Get the name of the decal to be sprayed
                    let decal_name = $('#decals_select').val();
                    //create the decal material
                    let decalMaterial = new BABYLON.StandardMaterial(decal_name, scene);
                    //load the texture for the decal through an intermediate server due to Cross Origin Resource Policy issues with firebase storage
                    decalMaterial.diffuseTexture = new BABYLON.Texture(`https://cors-anywhere.herokuapp.com/${decal_name}`, scene);
                    decalMaterial.diffuseTexture.hasAlpha = true;
                    //remove any shine from the light source
                    decalMaterial.specularColor = new BABYLON.Color3.Black();
                    //configure the x,y,z offset of the decal relative to the 3D model
                    decalMaterial.zOffset = -2;
                    decalMaterial.xOffset = -2;
                    decalMaterial.yOffset = -2;

                    //configure the size of the decal
                    let decalSize = new BABYLON.Vector3(3, 3, 1);
                    //Create a mesh for the decal and map it to the points of contact with the 3D model
                    let decal = BABYLON.MeshBuilder.CreateDecal("decal", mesh,
                        {
                            position: pickInfo.pickedPoint,
                            normal: pickInfo.getNormal(true),
                            size: decalSize
                        }
                    );
                    //set the id of the decal
                    decal.id = "decal";
                    //add the image of to be sprayed as a texture to the decal mesh
                    decal.material = decalMaterial;
                    //add the decal to the list of decals
                    decals.push(decal);
                    //set the position of the decal in the array as a tag
                    decal.tag = decals.length - 1;
                };//end of the onclick listener

                //for each sub mesh of the model attach a material, scale it and give it an id
                newMeshes.forEach(function (mesh) {
                    mesh.material = material;
                    mesh.name = "merch";
                    mesh.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
                    mesh.material.diffuseColor = new BABYLON.Color3(0.4, 0.1, 0.2);
                    mesh.position = new BABYLON.Vector3(0, 5, 0);
                    mesh.material.backFaceCulling = false;
                });
            });


            //get the value from the drop down of what model should be displayed
            scene.registerBeforeRender(function () {

            });

            engine.hideLoadingUI();
            return scene;
        };

        //get a reference to the scene
        const scene = createScene();
        //RENDER LOOP
        engine.runRenderLoop(function () {
            //GET THE VALUES OF THE  RGB Sliders
            let reds = $("#reds").val() / 255;
            let blues = $("#blues").val() / 255;
            let greens = $("#greens").val() / 255;
            //get teh value of the light sliders
            let light_intensity = $("#light").val() / 100;
            //get the light of the scene
            let light = scene.getLightByName("light");
            //get the material of the model
            let material = scene.getMaterialByName("material");
            //set the color of the material and the light intensity
            material.diffuseColor = new BABYLON.Color4(reds, greens, blues);
            light.intensity = light_intensity;
            //check if the user has selected a different merchandise model
            $('#merch_selects').on('change', function () {
                let current = scene.getMeshByName("merch");
                current.dispose();
                let model = $('#merch_selects').val();
                //check the value of the drop down
                if (model === 't-shirt') {
                    BABYLON.SceneLoader.ImportMesh("", "../../models/", "tshirt.babylon", scene, function (newMeshes) {
                        newMeshes.forEach(function (mesh) {
                            mesh.material = material;
                            mesh.name = "merch";
                            mesh.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
                            mesh.material = material;
                            mesh.position = new BABYLON.Vector3(0, 5, 0);
                            mesh.material.backFaceCulling = false;
                        });
                    });
                } else if (model === 'pants') {
                    BABYLON.SceneLoader.ImportMesh("", "../../models/", "pants.babylon", scene, function (newMeshes) {
                        newMeshes.forEach(function (mesh) {
                            mesh.material = material;
                            mesh.name = "merch";
                            mesh.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);
                            mesh.material = material;
                            mesh.position = new BABYLON.Vector3(0, 4, 0);
                            mesh.rotation.y = 6.3;
                            mesh.material.backFaceCulling = false;
                        });
                    });
                }
            });
            //check if the user has selected a different texture
            $('#texture_select').on('change', function () {
                let value = $('#texture_select').val();

                if (value === 'cotton') {
                    material.diffuseTexture = new BABYLON.Texture("../../models/textures/fabric_texture2.jpg", scene);
                    material.bumpTexture = new BABYLON.Texture("../../models/textures/fabric_bump.jpg", scene);
                    material.diffuseTexture.uScale = 15.0;
                    material.diffuseTexture.vScale = 15.0;
                    material.bumpTexture.uScale = 15.0;
                    material.bumpTexture.vScale = 15.0;
                } else if (value === 'denim') {
                    material.diffuseTexture = new BABYLON.Texture("../../models/textures/denim_texture.jpg", scene);
                    material.bumpTexture = new BABYLON.Texture("../../models/textures/denim_bump.jpg", scene);
                    material.diffuseTexture.uScale = 15.0;
                    material.diffuseTexture.vScale = 15.0;
                    material.bumpTexture.uScale = 15.0;
                    material.bumpTexture.vScale = 15.0;
                } else if (value === 'camo') {
                    material.diffuseTexture = new BABYLON.Texture("../../models/textures/camo_texture.jpg", scene);
                    material.bumpTexture = new BABYLON.Texture("../../models/textures/camo_bump.jpg", scene);
                    material.diffuseTexture.uScale = 3.0;
                    material.diffuseTexture.vScale = 3.0;
                    material.bumpTexture.uScale = 3.0;
                    material.bumpTexture.vScale = 3.0;
                } else if (value === 'knit') {
                    material.diffuseTexture = new BABYLON.Texture("../../models/textures/knit_texture.jpg", scene);
                    material.bumpTexture = new BABYLON.Texture("../../models/textures/knit_bump.jpg", scene);
                    material.diffuseTexture.uScale = 10.0;
                    material.diffuseTexture.vScale = 10.0;
                    material.bumpTexture.uScale = 10.0;
                    material.bumpTexture.vScale = 10.0;
                }
            });

            scene.render()
        });

        //Update the list of the decals every second
        window.setInterval(function () {
            updateDecalsList(decals);
        }, 500);
        // Watch for browser/canvas resize events
        window.addEventListener("resize", function () {
            engine.resize();
        });


        //get a reference to the publish button
        let publish = document.getElementById("publish_product_button");
        //if the publich button is clicked
        $(publish).on('click', async function () {
            //asynchronously take a screen shot of at 4 different angles around the 3D model and return a promise
            const img1 = new Promise(function (resolve, reject) {
                BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, scene.getCameraByID("camera1"), {
                    width: 480,
                    height: 480
                }, function (data) {
                    //once the screen shot is taken then resolve the promise returning a base64 encoded string of the image
                    resolve(data);
                })
            });
            const img2 = new Promise(function (resolve) {
                BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, scene.getCameraByName("camera2"), {
                    width: 480,
                    height: 480
                }, function (data) {
                    resolve(data);
                })
            });
            const img3 = new Promise(function (resolve) {
                BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, scene.getCameraByName("camera3"), {
                    width: 480,
                    height: 480
                }, function (data) {
                    resolve(data);
                })
            });
            const img4 = new Promise(function (resolve) {
                BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, scene.getCameraByName("camera4"), {
                    width: 480,
                    height: 480
                }, function (data) {
                    resolve(data);
                })
            });

            //Await for all promises to be resolved
            await Promise.all([img1, img2, img3, img4])
                .then(values => {
                    //Post the image strings to the back end where they will get handled
                    $.post('/users/profile/design/convertImage',{
                        //payload of the request
                        product_name:$('#product_name').val(),
                        price:$('#sale_price').val(),
                        img1:values[0],
                        img2:values[1],
                        img3:values[2],
                        img4:values[3],
                    },function (error) {
                        //in the case of an error log it
                        if(error)
                            console.error(error);
                    });
                })


        });


    } else {
        console.log("Babylon.js is not supported by your browser");
    }
});

function updateDecalsList(decals) {
    //get the list element
    let decal_list = document.getElementById("decals_list");
    let index = 0;
    //clear it
    decal_list.innerHTML = '';

    //add the decals on the thing
    decals.forEach(function (decal) {
        if (decal !== 0) {
            let li = document.createElement("li");
            let decal_id = document.createElement("div");
            $(decal_id).addClass("decal_id");
            $(decal_id).css("padding", "8px 10px");
            $(decal_id).css("width", "90%");
            $(decal_id).css("border-bottom", "1px solid white");
            $(decal_id).css("font-size", "1em");
            $(decal_id).css("float", "left");
            decal_id.innerHTML = `<span>decal_${decal.tag}</span>`;
            let button = document.createElement("button");
            button.innerHTML = `<span>&times</span>`;
            $(button).addClass("publish_btn");
            $(button).css("margin-left", "10px");
            button.onclick = function f() {
                decal.dispose();
                decals[decal.tag] = 0;
            };

            decal_id.appendChild(button);
            li.appendChild(decal_id);
            $(li).addClass("decal_list_item");
            decal_list.appendChild(li);
            index++;
        }
    });

}





