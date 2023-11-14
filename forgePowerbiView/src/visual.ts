
module powerbi.extensibility.visual {
    import DataViewObjectsParser = powerbi.extensibility.utils.dataview.DataViewObjectsParser;
    "use strict";
    export class PowerBI_ForgeViewer_Visual implements IVisual {

        //private readonly DOCUMENT_URN: string = 'urn:dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLlBPYXV4REk0VFRPbXdicnpLVjRRc0E_dmVyc2lvbj0x';

        // if get token from your server
        private ACCESS_TOKEN: string = null;
        private MY_SERVER_ENDPOINT = 'https://mamserver.herokuapp.com/api/forge/oauth/token'

        // if hard coded the token
        //private ACCESS_TOKEN: string = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IlU3c0dGRldUTzlBekNhSzBqZURRM2dQZXBURVdWN2VhIn0.eyJzY29wZSI6WyJkYXRhOnJlYWQiLCJkYXRhOndyaXRlIiwiZGF0YTpjcmVhdGUiLCJidWNrZXQ6cmVhZCIsImJ1Y2tldDpjcmVhdGUiLCJidWNrZXQ6ZGVsZXRlIl0sImNsaWVudF9pZCI6IkN1d3VLVEFRUGcwVmR5OE1INlZqb1NHMklNUUM5MXFXIiwiYXVkIjoiaHR0cHM6Ly9hdXRvZGVzay5jb20vYXVkL2Fqd3RleHA2MCIsImp0aSI6InN6czZGQ0xXQkVPdHE4UHMyZ0VXM3BCOWlodTV0NzlXbGtVOE56eFFkTnU0cHowWmNpR3ZTQmFZa1M2dXdjRGEiLCJleHAiOjE2NDU0NjMyMDh9.HRVQ_NzgSLHQVfaG4RToaf1GeX5LRtmQ3uS-KWBDBFSeTXIug_z4ESNz33XJCYOMN2mQ7tS1zoGZOYEP5D5UhCNlIgSX9Zh_M_9BJ9RIbqe4vrQFEMpdXTzpReAoki2zXC1CKcNPAih2nE5bweslteeMQe24E0hT-VAwpqjF-Hy0_J3xWd-oFqaMn_HWTvw7nOpLEZKCDDXvqwiGvOdo8EndqSKSDUTWlXGy20taW6nr534jLWwrKnR0FQsLBo1W3k5X8kwUi2Vwh3GjBfgkZ2Bo2szKhP0rDWtf1_75Y9w8RXgpe4D_I3JqE7qLlos9Daq6MPPzW9A4GSJ8MOkbnA';

        private target: HTMLElement;
        private pbioptions: VisualConstructorOptions;
        private updateCount: number;
        private settings: VisualSettings;
        private textNode: Text;
        private forge_viewer: Autodesk.Viewing.GuiViewer3D = null;
        private selectionMgr: ISelectionManager = null;
        private selectionIdBuilder: ISelectionIdBuilder = null;


        constructor(options: VisualConstructorOptions) {

            this.pbioptions = options;
            this.target = options.element;
            this.target.innerHTML = '<div id="forge-viewer" ></div>';

            if (typeof document !== "undefined") {

                if (this.ACCESS_TOKEN != null) {
                    //hard-coded token, load the model directly
                    this.initializeViewer("forge-viewer");

                } else {
                    this.getToken(this.MY_SERVER_ENDPOINT);
                    //inside getToken callback, will load the model

                }
            }
        }


        private async getToken(endpoint): Promise<void> {

            return new Promise<void>(res => {
                $.ajax({
                    url: endpoint,

                }).done(res => {
                    console.log('get token done!')
                    //console.log(res.access_token);

                    //when token is ready, start to initialize viewer
                    this.ACCESS_TOKEN = res.access_token;
                    this.initializeViewer("forge-viewer");
                })
            })
        }
        //Funcion para crear una instancia de visor vacía. Se necesita actualizar los valores de project y model para ver algo.

        private async initializeViewer(placeHolderDOMid: string): Promise<void> {
            const viewerContainer = document.getElementById(placeHolderDOMid)
            //load Forge Viewer scripts js and style css
            await this.loadForgeViewerScriptAndStyle();
            const options = {
                env: 'AutodeskProduction',
                accessToken: this.ACCESS_TOKEN
            }
            Autodesk.Viewing.Initializer(options, () => {
                var config3D = { extensions: ['Autodesk.DocumentBrowser', 'Autodesk.FullScreen','Autodesk.Hyperlink','Autodesk.VisualClusters'], }
                this.forge_viewer = new Autodesk.Viewing.GuiViewer3D(viewerContainer,config3D)
                this.forge_viewer.start();
                //Decode functions:
                function utf8_to_b64(str) {
                    return window.btoa((encodeURIComponent(str)));
                }
                function b64_to_utf8(str) {
                    return decodeURIComponent((window.atob(str)));
                }
                var project = "b.497d320f-7fa1-4ec3-9c2f-94aa35987bc5"
                var model = "urn:adsk.wipprod:dm.lineage:DoyqVSUXQouqV-9vSuuLzw"
                var c_project = utf8_to_b64(project);
                var c_model = utf8_to_b64(model);
                var url = 'https://mamserver.herokuapp.com/api/models/get?project=' + c_project + '&model=' + c_model
                fetch(url, {
                })
                    .then(res => {
                        res.json().then(data => {
                            var documentId = 'urn:' + data.urn
                            console.log('urn obtained!')
                            //------------------------------------------------------//
                            Autodesk.Viewing.Document.load(documentId, (doc) => {
                                var viewableId = undefined
                                var viewables: Autodesk.Viewing.BubbleNode = (viewableId ? doc.getRoot().findByGuid(viewableId) : doc.getRoot().getDefaultGeometry());
                                this.forge_viewer.loadDocumentNode(doc, viewables, {}).then(i => {
                                    console.log('document has been loaded')
                                    this.forge_viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, res => {
                                        //GEOMETRY_LOADED_EVENT
                                        console.log('GEOMETRY_LOADED_EVENT triggered!');
                                        console.log('dumpping dbIds...');
                                        this.forge_viewer.getObjectTree(tree => {
                                            var leaves = [];
                                            tree.enumNodeChildren(tree.getRootId(), dbId => {
                                                if (tree.getChildCount(dbId) === 0) {
                                                    leaves.push(dbId);
                                                }
                                            }, true);
                                        });
                                    })

                                    this.forge_viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, res => {
                                        //Investigation on how to update PowerBI Visual when objects are selected in Forge Viewer
                                        if (res.dbIdArray.length === 1) {
                                            const dbId = res.dbIdArray[0];
                                            console.log('Autodesk.Viewing.SELECTION_CHANGED_EVENT:' + dbId)
                                            //this.selectionMgr.select()
                                        }
                                    })
                                    this.forge_viewer.setGhosting(false)
                                });

                            }, (err) => {
                                console.error('onDocumentLoadFailure() - errorCode:' + err);
                            });

                        });
                    });
            })

        }

        private async loadForgeViewerScriptAndStyle(): Promise<void> {

            return new Promise<void>((reslove, reject) => {

                let forgeviewerjs = document.createElement('script');
                forgeviewerjs.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/viewer3D.js';
                forgeviewerjs.id = 'forgeviewerjs';
                document.body.appendChild(forgeviewerjs);
                //onload functions
                forgeviewerjs.onload = () => {
                    console.info("Viewer scripts loaded");
                    let link = document.createElement("link");
                    link.rel = 'stylesheet';
                    link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/style.min.css';
                    link.type = 'text/css';
                    link.id = "forgeviewercss";
                    let div_logo = document.createElement("div");
                    div_logo.id = "div_logo_idom"
                    div_logo.style.position = "absolute";
                    div_logo.style.zIndex = "2"
                    // div_logo.style.left = "0px"
                    div_logo.style.top = "0px"
                    let img = document.createElement("img")
                    img.id = "logo_idom"
                    img.style.width = "105px"
                    img.style.height = "40px"
                    img.style.zIndex = "2"
                    img.style.border = "none !important"
                    img.style.backgroundImage = "url(data:image/png;base64,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)"                 

                    // img.src = 'data:image/png;base64,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';
                    div_logo.appendChild(img);
                    document.body.appendChild(div_logo)
                    document.body.appendChild(link);
                    reslove();
                    console.log('Visor creado')
                };

                forgeviewerjs.onerror = (err) => {
                    console.info("Viewer scripts error:" + err);
                    reject(err);
                };

            })

        };
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            const settings: VisualSettings = this.settings || <VisualSettings>VisualSettings.getDefault();
            return VisualSettings.enumerateObjectInstances(settings, options);
        }

        public update(options: VisualUpdateOptions) {
            let dataView: DataView = options.dataViews[0]
            this.settings = VisualSettings.parse<VisualSettings>(dataView);
            //this.forge_viewer.clearThemingColors(this.forge_viewer.model)
            // if (options.type == 4) //|| options.type == 32//resizing or moving
            //     return;
            // if (!this.forge_viewer) {
            //     return;
            // }
            console.log('update with VisualUpdateOptions')

            const dbIds = options.dataViews[0].table.rows.map(r =>
                <number>r[0].valueOf());
            // console.log('dbIds: ' + dbIds)
            // this.forge_viewer.showAll();

            //  this.forge_viewer.impl.setGhostingBrightness(true); //for isolate effect 
            this.forge_viewer.isolate(dbIds);
            const propertyPanel = document.getElementById("ViewerPropertyPanel");
            propertyPanel.style.display = "none"
            const propertyPanelButton = document.getElementById("toolbar-propertiesTool");
            propertyPanelButton.className = "adsk-control adsk-button inactive"

            
            // this.forge_viewer.setSelectionColor(new THREE.Color('#10069F'),1)
            this.forge_viewer.fitToView(dbIds);

        }

        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

    }


}
