$(document).ready(function () {
    const canvas = document.getElementById('canvas');
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = function () {
        const scene1 = new BABYLON.Scene(engine);
        const scene2 = new BABYLON.Scene(engine);
        scene1.clearColor = new BABYLON.Color3.White();
        scene2.clearColor = new BABYLON.Color3.White();
        engine.enableOfflineSupport = false;

        const material = new BABYLON.StandardMaterial("material1", scene1);
        material.diffuseColor = BABYLON.Color3.Red();
       // material.diffuseTexture = new BABYLON.Texture("https://ucarecdn.com/5bfc85bf-4ce7-413c-851d-1ebe1cf407e2~1/nth/0/", scene1);

        const material2 = new BABYLON.StandardMaterial("material2", scene2);
        material2.diffuseColor = BABYLON.Color3.Red();
        //material2.diffuseTexture = new BABYLON.Texture("https://ucarecdn.com/5bfc85bf-4ce7-413c-851d-1ebe1cf407e2~1/nth/0/", scene2);





        const camera1 = new BABYLON.ArcRotateCamera("arcCamera",
            BABYLON.Tools.ToRadians(45),//roation around x
            BABYLON.Tools.ToRadians(45),//roation about y
            10.0, //radius
            new BABYLON.Vector3(0, 0, 0),//target object
            scene1);
        camera1.attachControl(canvas, true);
        const camera2 = new BABYLON.ArcRotateCamera("arcCamera",
            BABYLON.Tools.ToRadians(45),//roation around x
            BABYLON.Tools.ToRadians(45),//roation about y
            10.0, //radius
            new BABYLON.Vector3(0, 0, 0),//target object
            scene2);
        camera2.attachControl(canvas, true);

        const light1 = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, 10, 0), scene1);
        light1.parent = camera1;
        light1.diffuseColor = new BABYLON.Color3.White();

        const light2 = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, 10, 0), scene2);
        light2.parent = camera2;
        light2.diffuseColor = new BABYLON.Color3.White();


        BABYLON.SceneLoader.ImportMesh("", "", "../../models/t-shirt.babylon", scene1,
            function (newMeshes) {
                newMeshes.forEach(function (mesh) {
                    mesh.material = material;
                    mesh.name = "merch";
                    mesh.material.diffuseColor = new BABYLON.Color3.White();
                    //mesh.material.diffuseTexture = new BABYLON.Texture("../../images/texture.jpg",scene[1]);
                })
            });

        BABYLON.SceneLoader.ImportMesh("", "", "../../models/pants.babylon", scene2,
            function (newMeshes) {
                newMeshes.forEach(function (mesh) {
                    mesh.material = material2;
                    mesh.name = "merch";
                    mesh.material.diffuseColor = new BABYLON.Color3.White();
                   // mesh.material.diffuseTexture = new BABYLON.Texture("../../images/texture.jpg",scene[1]);
                })
            });

        return [scene1,scene2];
    };

    const scene = createScene();
    engine.runRenderLoop(function () {

        $('#imgPath').on('change',function () {
            let path = $('#imgPath').val();
        });
        let value = $('#merch_selects').val();
        if(value === 'pants'){
            scene[1].render();
            $('#color_select').on('change',function () {
                let pants = scene[1].getMeshByName('merch');
                let value = $('#color_select').val();
                if(value === "red"){
                    console.log("Red");
                    pants.material.diffuseColor = new BABYLON.Color3.Red();
                }else if(value === "green"){
                    console.log("Green");
                    pants.material.diffuseColor = new BABYLON.Color3.Green();
                }else if(value ==='blue'){
                    console.log("Blue");
                    pants.material.diffuseColor = new BABYLON.Color3.Blue();
                }else if(value ==='yellow'){
                    console.log("yellow");
                    pants.material.diffuseColor = new BABYLON.Color3.Yellow();
                }else if(value ==='black'){
                    console.log("black");
                    pants.material.diffuseColor = new BABYLON.Color3.Black();
                }else if(value ==='purple'){
                    console.log("purple");
                    pants.material.diffuseColor = new BABYLON.Color3.Purple();
                }
            });
            $('#texture_select').on('change',function () {
                let pants = scene[1].getMeshByName('merch');
                let value = $('#texture_select').val();

                if(value === 'textile'){
                    pants.material.diffuseTexture = new BABYLON.Texture("../../images/textile.jpg",scene[0]);
                }else if(value ==='fur'){
                    pants.material.diffuseTexture = new BABYLON.Texture("../../images/fur.jpg",scene[0]);
                }else if(value ==='waves'){
                    pants.material.diffuseTexture = new BABYLON.Texture("../../images/waves.jpg",scene[0]);
                }else if(value ==='image'){
                    pants.material.diffuseTexture = new BABYLON.Texture("../../images/image.jpg",scene[0]);
                }

            });
        }else if(value === 't-shirt'){
            scene[0].render();
            $('#color_select').on('change',function () {
                const tshirt = scene[0].getMeshByName('merch');
                let value = $('#color_select').val();
                if(value === "red"){
                    console.log("Red");
                    tshirt.material.diffuseColor = new BABYLON.Color3.Red();
                }else if(value === "green"){
                    console.log("Green");
                    tshirt.material.diffuseColor = new BABYLON.Color3.Green();
                }else if(value ==='blue'){
                    console.log("Blue");
                    tshirt.material.diffuseColor = new BABYLON.Color3.Blue();
                }else if(value ==='yellow'){
                    console.log("yellow");
                    tshirt.material.diffuseColor = new BABYLON.Color3.Yellow();
                }else if(value ==='black'){
                    console.log("black");
                    tshirt.material.diffuseColor = new BABYLON.Color3.Black();
                }else if(value ==='purple'){
                    console.log("purple");
                    tshirt.material.diffuseColor = new BABYLON.Color3.Purple();
                }
            });
            $('#texture_select').on('change',function () {
                let tshirt = scene[1].getMeshByName('merch');
                let value = $('#texture_select').val();

                if(value === 'textile'){
                    tshirt.material.diffuseTexture = new BABYLON.Texture("../../images/textile.jpg",scene[1]);
                }else if(value ==='fur'){
                    tshirt.material.diffuseTexture = new BABYLON.Texture("../../images/fur.jpg",scene[1]);
                }else if(value ==='waves'){
                    tshirt.material.diffuseTexture = new BABYLON.Texture("../../images/waves.jpg",scene[1]);
                }else if(value ==='image'){
                    tshirt.material.diffuseTexture = new BABYLON.Texture("../../images/image.jpg",scene[1]);
                }

            });
        }else if(value ==='socks'){
            scene[0].render();
            let mesh = scene[0].getMeshByName('merch');
            mesh.dispose(true,true);
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


});