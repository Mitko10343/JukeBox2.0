//whenever the document is loaded
/// <reference path="/public/javascripts/babylonjs/babylon.js" />
$(document).ready(function () {
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
        const createScene = function () {
            //disable offline support for gradle
            engine.enableOfflineSupport = false;
            //Create scene
            let scene = new BABYLON.Scene(engine);
            //configure the scene
            scene.clearColor = new BABYLON.Color4(0.5, 0.5, 0.5, 1);

            //create a light for the scene
            //create a light source for scene1 and attach it to the camera
            const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 50, 0), scene);
            light.diffuseColor = new BABYLON.Color3.White();

            //create an arc rotate camera that will be rotating around the center
            const camera = new BABYLON.ArcRotateCamera("camera", BABYLON.Tools.ToRadians(270), BABYLON.Tools.ToRadians(90), 14.0, new BABYLON.Vector3(0, 7, 0), scene);
            const camera1 = new BABYLON.ArcRotateCamera("camera1", BABYLON.Tools.ToRadians(270), BABYLON.Tools.ToRadians(90), 12.0, new BABYLON.Vector3(0, 7, 0), scene);
            const camera2 = new BABYLON.ArcRotateCamera("camera2", BABYLON.Tools.ToRadians(360), BABYLON.Tools.ToRadians(90), 12.0, new BABYLON.Vector3(0, 7, 0), scene);
            const camera3 = new BABYLON.ArcRotateCamera("camera3", BABYLON.Tools.ToRadians(90), BABYLON.Tools.ToRadians(90), 12.0, new BABYLON.Vector3(0, 7, 0), scene);
            const camera4 = new BABYLON.ArcRotateCamera("camera4", BABYLON.Tools.ToRadians(180), BABYLON.Tools.ToRadians(90), 12.0, new BABYLON.Vector3(0, 7, 0), scene);
            camera.attachControl(canvas, true);




            //Configure limit for the camera zoom and rotation
            camera.lowerBetaLimit = 0.1;
            camera.upperBetaLimit = (Math.PI / 2) * 0.99;
            camera.lowerRadiusLimit = 10;

            //create a texture for the wooden floor in scene 1
            const ground_texture = new BABYLON.StandardMaterial('ground', scene);
            ground_texture.diffuseTexture = new BABYLON.Texture("../../models/textures/floor.jpg", scene);
            ground_texture.bumpTexture = new BABYLON.Texture("../../models/textures/floor_bump.jpg", scene);
            ground_texture.specularColor = new BABYLON.Color3.Black();
            ground_texture.diffuseTexture.uScale = 5.0;
            ground_texture.diffuseTexture.vScale = 5.0;
            ground_texture.bumpTexture.uScale = 5.0;
            ground_texture.bumpTexture.vScale = 5.0;

            //create a mesh for the wooden floor in scene 1 and attach the texture to it
            const ground = new BABYLON.Mesh.CreateGroundFromHeightMap("ground", "../../models/textures/floor_roughness.jpg", 500, 500, 200, 0, 0.5, scene, false);
            ground.material = ground_texture;


            //create a standard material for the model
            const material = new BABYLON.StandardMaterial("material", scene);
            material.specularColor = new BABYLON.Color3.Black();
            material.diffuseColor = new BABYLON.Color3.White();
            material.diffuseTexture = new BABYLON.Texture("../../models/textures/fabric_texture2.jpg", scene);
            material.diffuseTexture.uScale = 10.0;
            material.diffuseTexture.vScale = 10.0;
            material.bumpTexture = new BABYLON.Texture("../../models/textures/fabric_bump.jpg", scene);
            material.bumpTexture.uScale = 10.0;
            material.bumpTexture.vScale = 10.0;


            //render the mesh
            BABYLON.SceneLoader.ImportMesh("", "../../models/", "tshirt.babylon", scene, function (newMeshes) {
                let mesh = newMeshes[1];

                scene.onPointerDown = function (evt, pickInfo) {
                    if (evt.button !== 0)
                        return;


                    let decal_name = $('#decals_select').val();

                    let decalMaterial = new BABYLON.StandardMaterial(decal_name, scene);
                    decalMaterial.diffuseTexture = new BABYLON.Texture(`https://cors-anywhere.herokuapp.com/${decal_name}`, scene);
                    decalMaterial.diffuseTexture.hasAlpha = true;
                    decalMaterial.specularColor = new BABYLON.Color3.Black();
                    decalMaterial.zOffset = -2;
                    decalMaterial.xOffset = -2;
                    decalMaterial.yOffset = -2;

                    let decalSize = new BABYLON.Vector3(3, 3, 1);
                    let decal = BABYLON.MeshBuilder.CreateDecal("decal", mesh,
                        {
                            position: pickInfo.pickedPoint,
                            normal: pickInfo.getNormal(true),
                            size: decalSize
                        }
                    );
                    decal.id = "decal";
                    decal.material = decalMaterial;

                    decals.push(decal);
                    decal.tag = decals.length - 1;
                };

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

            $('.x_pos').each(function (index) {
                $(this).on('change', function () {
                    let tag = document.getElementsByClassName("anchors")[index].id;
                    let decal = scene.getMeshesByTags(tag);
                    decals.xScale = $('.x_pos').val();
                });
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


        //100% working
        let publish = document.getElementById("publish_product_button");
        $(publish).on('click', async function () {
            console.log("getting images");
            const img1 = new Promise(function (resolve, reject) {
                BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, scene.getCameraByID("camera1"), {
                    width: 480,
                    height: 480
                }, function (data) {
                    resolve(data);
                })
            });
            const img2 = new Promise(function (resolve, reject) {
                BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, scene.getCameraByName("camera2"), {
                    width: 480,
                    height: 480
                }, function (data) {
                    resolve(data);
                })
            });
            const img3 = new Promise(function (resolve, reject) {
                BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, scene.getCameraByName("camera3"), {
                    width: 480,
                    height: 480
                }, function (data) {
                    resolve(data);
                })
            });
            const img4 = new Promise(function (resolve, reject) {
                BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, scene.getCameraByName("camera4"), {
                    width: 480,
                    height: 480
                }, function (data) {
                    resolve(data);
                })
            });

            await Promise.all([img1, img2, img3, img4])
                .then(values => {
                    console.log(values);
                    $.post('/users/profile/design/convertImage',{
                        product_name:$('#product_name').val(),
                        price:$('#sale_price').val(),
                        img1:values[0],
                        img2:values[1],
                        img3:values[2],
                        img4:values[3],
                    },function (error) {
                        if(error)
                            console.error(error);
                    });
                })
                .catch(error => {
                    console.error();
                })

        });


    } else {
        console.log("Babylon.js is not supported by your browser");
    }


    /* //get a reference of the canvas
     const canvas = document.getElementById('canvas');
     //Create an instance of the babylon engine
     const engine = new BABYLON.Engine(canvas, true);

     //prevent the page scrolling when ever the mouse wheel is scrolled inside the canvas
     $(canvas).on('onwheel', function (event) {
         event.preventDefault();
     });
     //Same as above, however this is for mozilla firefox
     $(canvas).on('mousewheel', function (event) {
         event.preventDefault();
     });

     //create a scene
     const createScene = function () {
         //enable offline support
         engine.enableOfflineSupport = false;
         //Instantiate a babylon scene for the polo shirt
         const scene1 = new BABYLON.Scene(engine);
         //set the background color of the scene
         scene1.clearColor = new BABYLON.Color4(0.6, 0.6, 0.4);
         //create a texture for the wooden floor in scene 1
         const ground_texture = new BABYLON.StandardMaterial('ground', scene1);
         ground_texture.diffuseTexture = new BABYLON.Texture("../../images/wood.jpg", scene1);
         //create a mesh for the wooden floor in scene 1 and attach the texture to it
         const ground = new BABYLON.Mesh.CreateGround("ground1", 500, 500, 2, scene1);
         ground.material = ground_texture;


         //create a material for scene 1
         const material = new BABYLON.StandardMaterial("material1", scene1);
         material.diffuseColor = new BABYLON.Color4(0.1, 0.1, 0.1,0.1);
         material.diffuseTexture = new BABYLON.Texture('../../images/cloth.jpg');

         //Configure the camera for scene 1
         //Arc rotate camera that will rotate around the x and y axis
         const camera1 = new BABYLON.ArcRotateCamera("arcCamera", BABYLON.Tools.ToRadians(270), BABYLON.Tools.ToRadians(90), 10.0, new BABYLON.Vector3(0, 15, 0),scene1);
         //Attach the built in controlss to the camera
         camera1.attachControl(canvas, true);
         //Configure limit for the camera zoom and rotation
         camera1.lowerBetaLimit = 0.1;
         camera1.upperBetaLimit = (Math.PI / 2) * 0.99;
         camera1.lowerRadiusLimit = 10;

         //drag and drop events
         // Events
         let startingPoint;
         let currentMesh;

         //get the position of the ground
         const getGroundPosition = function () {
             // Use a predicate to get position on the ground
             const pickinfo = scene1.pick(scene1.pointerX, scene1.pointerY, function (mesh) {
                 return mesh === ground;
             });

             if (pickinfo.hit)
                 return pickinfo.pickedPoint;

             return null;
         };
         //if the mouse is clicked
         scene1.onPointerDown = function (evt) {
             if (evt.button !== 0)
                 return;

             // check if we clicked the ground
             let pickInfo = scene1.pick(scene1.pointerX, scene1.pointerY, function (mesh) {
                 return mesh !== ground;
             });

             //check if the mesh that was clicked was not the ground
             if (pickInfo.hit) {
                 //set the mesh that was clicked
                 currentMesh = pickInfo.pickedMesh;
                 //set the starting point
                 startingPoint = getGroundPosition(evt);

                 // we need to disconnect camera from canvas
                 if (startingPoint) {
                     setTimeout(function () {
                         camera1.detachControl(canvas);
                     }, 0);
                 }
             }
         };
         //If the pointer is dragged when clicked
         scene1.onPointerMove = function (evt) {
             if (!startingPoint)
                 return;

             let current = getGroundPosition(evt);

             if (!current)
                 return;

             let diff = current.subtract(startingPoint);

             console.log(diff.y);
             scene1.registerBeforeRender(function () {
                 material.diffuseTexture.uRotate = diff.x * 0.1;
                 material.diffuseTexture.vOffset = diff.z * 0.5;
             });

             startingPoint = current;
         };

         //If the mouse button is released then re-attach the camera controls and reset the start position
         scene1.onPointerUp = function () {
             if (startingPoint) {
                 camera1.attachControl(canvas, true);
                 startingPoint = null;
             }
         };

         //create a light source for scene1 and attach it to the camera
         const light1 = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, 10, 0), scene1);
         light1.parent = camera1;
         light1.intensity = 0.7;
         light1.diffuseColor = new BABYLON.Color3.White();


         //Creation of a repeated textured material
         const material3 = new BABYLON.StandardMaterial("texturePlane", scene1);
         material3.diffuseTexture = new BABYLON.Texture("../../images/waves.jpg", scene1);
         material3.backFaceCulling = false;

         //create a multi material
         const multimat = new BABYLON.MultiMaterial("multi", scene1);
         //push two materials to it
         multimat.subMaterials.push(material);
         multimat.subMaterials.push(material3);

         //render the mesh for the polo shirt which will be rendered in scene 1
         BABYLON.SceneLoader.ImportMesh("", "../../models/", "tshirt.babylon", scene1, function (newMeshes) {
             newMeshes.forEach(function (mesh) {
                 mesh.material = material;
                 mesh.name = "merch";
                 mesh.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
                 mesh.material.diffuseColor = new BABYLON.Color3(0.4, 0.1, 0.2);
                 mesh.position = new BABYLON.Vector3(0, 15, 0);
                 mesh.material.backFaceCulling = false;
             });
         });

         //Instantiate a babylon scene for the pants
         const scene2 = new BABYLON.Scene(engine);

         //set the background color of the scene
         scene2.clearColor = new BABYLON.Color4(0.6, 0.6, 0.4);

         //create a material for scene 2
         const material2 = new BABYLON.StandardMaterial("material2", scene2);
         material2.diffuseColor = BABYLON.Color3.Red();

         //Configure the camera for scene 2
         //Arc rotate camera that will rotate around the x and y axis
         //
         const camera2 = new BABYLON.ArcRotateCamera("arcCamera",
             BABYLON.Tools.ToRadians(240),//roation around x
             BABYLON.Tools.ToRadians(70),//roation about y
             20.0, //radius
             new BABYLON.Vector3(0, 20, 0),//target object
             scene2);
         camera2.attachControl(canvas, true);

         //create a light source for scene2 and attach it to the camera
         const light2 = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, 10, 0), scene2);
         light2.parent = camera2;
         light2.intensity = 0.7;
         light2.diffuseColor = new BABYLON.Color3.White();

         //Import that mesh for the pants that will be rendered in scene 2
         BABYLON.SceneLoader.ImportMesh("", "../../models/", "pants.babylon", scene2,
             function (newMeshes) {
                 newMeshes.forEach(function (mesh) {
                     mesh.material = material2;
                     mesh.name = "merch";
                     mesh.material.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                     mesh.position = new BABYLON.Vector3(0, 10, 0);

                 })
             });

         //create a texture for the ground
         const ground_texture2 = new BABYLON.StandardMaterial('ground2', scene2);
         ground_texture2.diffuseTexture = new BABYLON.Texture("../../images/wood.jpg", scene2);

         //create a ground for the scene
         const ground2 = new BABYLON.Mesh.CreateGround("ground1", 500, 500, 2, scene2);
         ground2.material = ground_texture2;

         // material.diffuseTexture = new BABYLON.Texture("https://ucarecdn.com/5bfc85bf-4ce7-413c-851d-1ebe1cf407e2~1/nth/0/", scene1);
         //material2.diffuseTexture = new BABYLON.Texture("https://ucarecdn.com/5bfc85bf-4ce7-413c-851d-1ebe1cf407e2~1/nth/0/", scene2);

         //return a scene for both the polo shirt and the pants
         return [scene1, scene2];
     };

     //create the scene
     const scene = createScene();

     engine.runRenderLoop(function () {

         $('#imgPath').on('change', function () {
             let path = $('#imgPath').val();
         });
         let value = $('#merch_selects').val();

         if (value === 'pants') {
             scene[1].render();
             $('#color_select').on('change', function () {
                 let pants = scene[1].getMeshByName('merch');
                 let value = $('#color_select').val();
                 if (value === "red") {
                     console.log("Red");
                     pants.material.diffuseColor = new BABYLON.Color3.Red();
                 } else if (value === "green") {
                     console.log("Green");
                     pants.material.diffuseColor = new BABYLON.Color3.Green();
                 } else if (value === 'blue') {
                     console.log("Blue");
                     pants.material.diffuseColor = new BABYLON.Color3.Blue();
                 } else if (value === 'yellow') {
                     console.log("yellow");
                     pants.material.diffuseColor = new BABYLON.Color3.Yellow();
                 } else if (value === 'black') {
                     console.log("black");
                     pants.material.diffuseColor = new BABYLON.Color3.Black();
                 } else if (value === 'purple') {
                     console.log("purple");
                     pants.material.diffuseColor = new BABYLON.Color3.Purple();
                 }
             });
             $('#texture_select').on('change', function () {
                 let pants = scene[1].getMeshByName('merch');
                 let value = $('#texture_select').val();

                 if (value === 'textile') {
                     pants.material.diffuseTexture = new BABYLON.Texture("../../images/textile.jpg", scene[0]);
                 } else if (value === 'fur') {
                     pants.material.diffuseTexture = new BABYLON.Texture("../../images/fur.jpg", scene[0]);
                 } else if (value === 'waves') {
                     pants.material.diffuseTexture = new BABYLON.Texture("../../images/waves.jpg", scene[0]);
                 } else if (value === 'image') {
                     pants.material.diffuseTexture = new BABYLON.Texture("../../images/image.jpg", scene[0]);
                 }

             });
         } else if (value === 't-shirt') {
             scene[0].render();
             $('#color_select').on('change', function () {
                 const tshirt = scene[0].getMeshByName('merch');
                 let value = $('#color_select').val();
                 if (value === "red") {
                     console.log("Red");
                     tshirt.material.diffuseColor = new BABYLON.Color3.Red();
                 } else if (value === "green") {
                     console.log("Green");
                     tshirt.material.diffuseColor = new BABYLON.Color3.Green();
                 } else if (value === 'blue') {
                     console.log("Blue");
                     tshirt.material.diffuseColor = new BABYLON.Color3.Blue();
                 } else if (value === 'yellow') {
                     console.log("yellow");
                     tshirt.material.diffuseColor = new BABYLON.Color3.Yellow();
                 } else if (value === 'black') {
                     console.log("black");
                     tshirt.material.diffuseColor = new BABYLON.Color3.Black();
                 } else if (value === 'purple') {
                     console.log("purple");
                     tshirt.material.diffuseColor = new BABYLON.Color3.Purple();
                 }
             });
             $('#texture_select').on('change', function () {
                 let tshirt = scene[0].getMeshByName('merch');
                 let value = $('#texture_select').val();

                 if (value === 'textile') {
                     tshirt.material.diffuseTexture = new BABYLON.Texture("../../images/textile.jpg", scene[1]);
                 } else if (value === 'fur') {
                     tshirt.material.diffuseTexture = new BABYLON.Texture("../../images/fur.jpg", scene[1]);
                 } else if (value === 'waves') {
                     tshirt.material.diffuseTexture = new BABYLON.Texture("../../images/waves.jpg", scene[1]);
                 } else if (value === 'image') {
                     tshirt.material.diffuseTexture = new BABYLON.Texture("../../images/image.jpg", scene[1]);
                 }

             });
         } else if (value === 'socks') {
             scene[0].render();
             let mesh = scene[0].getMeshByName('merch');
             mesh.dispose(true, true);
             BABYLON.SceneLoader.ImportMesh("", "", "../../models/socks.babylon", scene[0],
                 function (newMeshes) {
                     newMeshes.forEach(function (mesh) {
                         mesh.material = material2;
                         mesh.name = "merch";
                         mesh.material.diffuseColor = new BABYLON.Color3.White();
                         // mesh.material.diffuseTexture = new BABYLON.Texture("../../images/texture.jpg",scene[1]);
                     })
                 });

         }


     });

     // Watch for browser/canvas resize events
     window.addEventListener("resize", function () {
         engine.resize();
     });*/
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





