**Tabla de Contenido**

[TOC]

# General Models

- Adicionalmente a los Campos propios de cada Modelo, estos poseen una serie de campos para el debido control del documento en general, estos son:

    ```javascript
    created_at  : { type: Date, default: Date.now }
    updated_at  : { type: Date, default: Date.now }
    deleted_at  : { type: Date, default: null }
    delete      : { type: Boolean, default: false }
    status      : { type: String, default: 'active' }
    ```
    **Descripcion**:

    - **created_at:** Campo **Date** que contiene la fecha de Creacion del Documento
    - **updated_at:** Campo **Date** que contiene la fecha de Actualizacion del Documento
    - **deleted_at:** Campo **Date** que contiene la fecha de Eliminacion del Documento
    - **delete:** Campo **Boolean** que indica si el documento fue Eliminado logicamente **( true )** o no **( false )**
    - **status:** Campo **String** que indica si el documento esta activo **( 'active' )** o inactivo **( 'inactive' )**

        + **Nota:** Inicialmente este campo fue pensado solo para los valores active e inactive, pero puede adoptar otros valores dependiendo de la naturaleza del modelo, siempre y cuando los valores de active e inactive sean interpretados de la misma forma en dichos modelos


# Users Module [(link folder)](https://gitlab.com/2becommercedevelopers/hefesto-back-services/-/tree/dev-pedro/users-module "/users-module") 

- ## Api Access [(link file)](https://gitlab.com/2becommercedevelopers/hefesto-back-services/-/tree/dev-pedro/users-module/api-access.model.js "/users-module/api-access.model.js") 

    ```javascript
    name        : { type: String,   default: null }
    host_name   : { type: String,   default: null }
    token       : { type: String,   default: null }
    permissions : [{ type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_api_route', autopopulate: true }]
    test        : { type: Boolean,  default: false }
    ```
    **Descripcion**:

    - **name:** Campo **String** que contiene el Nombre de la app que utilizara la Api
    - **host_name:** Campo **String** que contiene el Host de la app Ejemplo: 2becommerce.com
    - **token:** Campo **String** que contiene el Token de Acceso para la app, este token integra el resto de campos, por lo que si cambian este tambien
    - **permissions:** Campo **Array ObjectId** que contiene una referencias a los permisos asigandos para este acceso del Modelo **back_api_route**
    - **test:** Campo **Boolean** que indica si este acceso es para el desarrollo de pruebas y no involucra la data original

- ## Customer [(link file)](https://gitlab.com/2becommercedevelopers/hefesto-back-services/-/tree/dev-pedro/users-module/customer.model.js "/users-module/customer.model.js") 

    ```javascript
    shopify_id      : { type: Number, default: null }
    first_name      : { type: String, default: null }
    last_name       : { type: String, default: null }
    phone           : { type: String, default: null }
    email           : { type: String, default: null }
    agent_email     : { type: String, default: null }
    tags            : { type: Object, default: [] }
    addresses       : { type: Object, default: [] }
    country         : { type: String, default: null }
    state           : { type: String, default: null }
    language        : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'agent_language', autopopulate: true }
    type_business   : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'agent_typebusiness', autopopulate: true }
    customer_type   : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'agent_customertype', autopopulate: true }
    product_category: { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'agent_categoryproduct', autopopulate: true }
    note            : { type: String, default: null }
    first_order     : { type: Object, default: null }
    last_order      : { type: Object, default: null }
    orders_count    : { type: Number, default: 0 }
    total_spent     : { type: Number, default: 0 }
    is_dropshipping : { type: Boolean, default: false }
    ```
    
    **Descripcion**:

    - **shopify_id:** Campo **Number** que contiene el id en shopify del Cliente
    - **first_name:** Campo **String** que contiene el o los nombres del Cliente
    - **last_name:** Campo **String** que contiene el o los apellidos del Cliente
    - **phone:** Campo **String** que contiene el telefono del Cliente
    - **email:** Campo **String** que contiene el correo electronico del Cliente
    - **agent_email:** Campo **String** que contiene el correo elctronico del Agente comercial ( Este campo es provicional para la sincronizacion de los datos actuales en Shopify)
    - **tags:** Campo **Array** que contiene un arreglo con los tags del Cliente, Ejemplo: [ "Hola", "Mundo" ]
    - **addresses:** Campo **Object** que contiene un arreglo con las Direcciones del Cliente, cada direccion tiene la siguiente estructura:
    
        ```javascript
        id              : { type: Number,   default: 0 }
        default         : { type: Boolean,  default: false }
        first_name      : { type: String,   default: null }
        last_name       : { type: String,   default: null }
        phone           : { type: String,   default: null }
        company         : { type: String,   default: null }
        address_1       : { type: String,   default: null }
        address_2       : { type: String,   default: null }
        country_name    : { type: String,   default: null }
        country_code    : { type: String,   default: null }
        state           : { type: String,   default: null }
        state_code      : { type: String,   default: null }
        city            : { type: String,   default: null }
        zip             : { type: String,   default: null }
        ```
        **Descripcion:**

        - **id:** Campo **Number** que contiene el indice de la direccion en el arreglo
        - **default:** Campo **Boolean** que indica si la direccion es la predeterminada **( true )** o no **( false )**
        - **first_name:** Campo **String** que contiene el o los nombres de la persona que recibe la Orden
        - **last_name:** Campo **String** que contiene el o los apellidos de la persona que recibe la Orden
        - **phone:** Campo **String** que contiene el numero de telefono de la persona que recibe la Orden
        - **company:** Campo **String** que contiene la compañia que recibe la Orden
        - **address_1:** Campo **String** que contiene la parte principal de la direccion
        - **address_2:** Campo **String** que contiene la parte complementaria de la direccion
        - **country_name:** Campo **String** que contiene el nombre del Pais a donde se envia la Orden
        - **country_code:** Campo **String** que contien el Codigo ISO 3166-2 del Pais
        - **state:** Campo **String** que contiene el Nonbre del Estado a donde se envia la Orden **( en Shopify es llamado province )**
        - **state_code:** Campo **String** que contien el Codigo ISO 3166-2 del Estado **( en Shopify es llamado province_code )**
        - **city:** Campo **String** que contiene el nombre de la ciudad a donde se envia la Orden
        - **zip:** Campo **String** que contien el Zip-code donde se enviara la Orden

    - **country:** Campo **String** que contiene el nombre del Pais del Cliente
    - **state:** Campo **String** que contiene el nombre del estado asociado al Pais
    - **language:** Campo **ObjectId** que hace referencia al lengiage asignado al Cliente en el modelo **agent_language**
    - **type_business:** Campo **ObjectId** que hace referencia al tipo de negocio seleccionado por el Cliente en el modelo **agent_typebusiness**
    - **customer_type:** Campo **ObjectId** que hace referencia al tipo de Cliente asignado en el modelo **agent_customertype**
    - **product_category:** Campo **ObjectId** que hace referencia a la categoria de producto seleccionado por el Cliente en el modelo **agent_categoryproduct**
    - **note:** Campo **String** que contiene las notas de Shopify del Cliente
    - **first_order:** Campo **Object** que contiene los datos de la primera Orden del Cliente, estos son:
    
        ```javascript
        id          : { type: Number,   default: null }
        name        : { type: String,   default: null }
        created_at  : { type: Date,     default: null }
        ```

        **Descripcion:**

        - **id:** Campo **String** que contiene el id en shopify de la primera Orden
        - **name:** Campo **String** que contiene el nombre de la primera Orden Ejemplo: PLN-1001
        - **created_at:** Campo **Date** que contiene la fecha en que fue creada la primera orden del cliente

    - **last_order:** Campo **String**  que contiene los datos de la ultima Orden del Cliente, estos son:

        ```javascript
        id          : { type: Number,   default: null }
        name        : { type: String,   default: null }
        created_at  : { type: Date,     default: null }
        ```
        **Descripcion**:

        - **name:** Campo **String** que contiene el nombre de la ultima Orden Ejemplo: PLN-1001
        - **id:** Campo **String** que contiene el id en shopify de la ultima Orden
        - **created_at:** Campo **Date** que contiene la fecha en que fue creada la ultima orden del cliente

    - **orders_count:** Campo **Number** que contiene Numero de Orden que lleva comprado el clinete
    - **total_spent:** Campo **Number** que contiene el total de todas las ordenes del Cliente
    - **is_dropshipping:** Campo **Boolean** que indica si este es Cliente Dropshipping **( true )** o no **( false )**


- ## User [(link file)](https://gitlab.com/2becommercedevelopers/hefesto-back-services/-/tree/dev-pedro/users-module/user.model.js "/users-module/user.model.js") 

    ```javascript
    role        : { type: mongoose.Schema.Types.ObjectId, default: null,  ref: 'back_role', autopopulate: true }
    customer    : { type: mongoose.Schema.Types.ObjectId, default: null,  ref: 'back_customer', autopopulate: true }
    agent       : { type: mongoose.Schema.Types.ObjectId, default: null,  ref: 'agent_user', autopopulate: true }
    first_name  : { type: String,   default: null }
    last_name   : { type: String,   default: null }
    email       : { type: String,   default: null }
    password    : { type: String,   default: null }
    token_login : { type: String,   default: null }
    ```

    **Descripcion**:

    - **role:** Campo **ObjectId** que hace referencia al Rol asignado al Usuario en el modelo **back_role**
    - **customer:** Campo **ObjectId** que hace referencia al Cliente asignado al Usuario en el modelo **back_customer**
    - **agent:** Campo **ObjectId** que hace referencia al Agente asignado al Usuario en el modelo **agent_user**
    - **first_name:** Campo **String** que contiene el o los nombres del Usuario
    - **last_name:** Campo **String** que contiene el o los apellidos del Usuario
    - **email:** Campo **String** que contiene el correo electronico del Usuario
    - **password:** Campo **String** que contiene un hash codificado con la contraseña del Usuario
    - **token_login:** Campo **String** que contiene el token de acceso del Usuario a la aplicacion este se genera cada vez que el usuario quiere acceder a los datos de la aplicacion

# Sotres Module [(link folder)](https://gitlab.com/2becommercedevelopers/hefesto-back-services/-/tree/dev-pedro/stores-module "/stores-module")

- ## Cart [(link file)](https://gitlab.com/2becommercedevelopers/hefesto-back-services/-/tree/dev-pedro/stores-module/cart.model.js "/stores-module/cart.model.js") 

    ```javascript
    customer    : { type: mongoose.Schema.Types.ObjectId, default: null,  ref: 'back_customer',  autopopulate: true }
    products    : { type: Object,   default: [] }
    save_later  : { type: Object,   default: [] }
    ```

    **Descripcion**:

    - **customer:** Campo **ObjectId** que hace referencia al Cliente asignado al Carrito en el modelo **back_customer**
    - **products:** Campo **Array** que contiene las variantes de productos agregadas al carrito, cada variante tiene la siguiente estructura:

        ```javascript
        product_id  : { type: Number,   default: null }
        variant_id  : { type: Number,   default: null }
        sku         : { type: String,   default: null }
        quantity    : { type: Number,   default: null }
        ```

        **Descripcion**:
        
        - **product_id**: Campo **Number** que contiene el id de shopify del Producto
        - **variant_id**: Campo **Number** que contiene el id de shopify de la Variante del Producto
        - **sku**: Campo **String** que contiene el SKU (Stock Keeping Unit) de la variante
        - **quantity**: Campo **Number** que contiene la cantidad de unidades de la variante agregada al carrito

    - **save_later:** Campo **Array** que contiene contiene las variantes de productos agregados al carrito que fueron guardados en una lista separada tipo wish list, cada variante tiene la siguiente estructura:

        ```javascript
        product_id  : { type: Number,   default: null }
        variant_id  : { type: Number,   default: null }
        sku         : { type: String,   default: null }
        quantity    : { type: Number,   default: null }
        ```

        **Descripcion**:
        
        - **product_id**: Campo **Number** que contiene el id de shopify del Producto
        - **variant_id**: Campo **Number** que contiene el id de shopify de la Variante del Producto
        - **sku**: Campo **String** que contiene el SKU (Stock Keeping Unit) de la variante
        - **quantity**: Campo **Number** que contiene la cantidad de unidades de la variante agregada al carrito

- ## Order [(link file)](https://gitlab.com/2becommercedevelopers/hefesto-back-services/-/tree/dev-pedro/stores-module/order.model.js "/stores-module/order.model.js") 

    ```javascript
    customer                : { type: mongoose.Schema.Types.ObjectId, default: null,  ref: 'back_customer', autopopulate: true }
    bono                    : { type: mongoose.Schema.Types.ObjectId, default: null,  ref: 'agent_bono',   autopopulate: true }
    shopify_id              : { type: Number,   default: null }
    name                    : { type: String,   default: null }
    number                  : { type: Number,   default: null }
    order_number            : { type: Number,   default: null }
    token                   : { type: String,   default: null }
    line_items              : [{ type: mongoose.Schema.Types.ObjectId, default: null,  ref: 'back_order_line_item', autopopulate: true }]
    skus                    : { type: Object,   default: [] }
    brands                  : { type: Object,   default: [] }
    variants                : { type: Object,   default: [] }
    taxes_included          : { type: Boolean,  default: false }
    tax_lines               : { type: Object,   default: [] }
    subtotal_price          : { type: Number,   default: 0 }
    total_discounts         : { type: Number,   default: 0 }
    total_line_items_price  : { type: Number,   default: 0 }
    total_outstanding       : { type: Number,   default: 0 }
    total_price             : { type: Number,   default: 0 }
    total_shipping_price    : { type: Number,   default: 0 }
    total_tax               : { type: Number,   default: 0 }
    checkout_id             : { type: Number,   default: null }
    checkout_token          : { type: String,   default: null }
    payment_details         : { type: Object,   default: null }
    total_weight            : { type: Number,   default: 0 }
    billing_address         : { type: Object,   default: null }
    shipping_address        : { type: Object,   default: null }
    shipping_lines          : { type: Object,   default: [] }
    fulfillments            : { type: Object,   default: [] }
    refunds                 : { type: Object,   default: [] }
    cancel_reason           : { type: String,   default: null }
    note                    : { type: String,   default: null }
    note_attributes         : { type: Object,   default: [] }
    financial_status        : { type: String,   default: null }
    fulfillment_status      : { type: String,   default: null }
    order_status_url        : { type: String,   default: null }
    ```
    **Descripcion**:

    - **customer:** Campo **ObjectId** que hace referencia al Cliente del modelo **back_customer** dueño de la Orden
    - **bono:** Campo **ObjectId** que hace referencia al bono del modelo **agent_bono** usado en una Orden
    - **shopify_id:** Campo **Number** que contiene el id de Shopify de la Orden
    - **name:** Campo **String** que contiene el nombre del Orden bajo un formato preestablecido en Shopify
    - **number:** Campo **Number** que contiene el numero correlativo de la orden este numero empieza en 1 y aumenta de 1 en 1
    - **order_number:** Campo **Number** que contiene el numero de la orden este numero empieza en 1001 y aumenta de 1 en 1
    - **token:** Campo **String** que contiene un valor unico que hace referencia a la Orden en Shopify
    - **line_items:** Campo **Array ObjectId** que contiene referencias a los line items del Modelo **back_order_line_item**
    - **skus:** Campo **Array** que contiene los skus de los line items
    - **brands:** Campo **Array** que contiene las marcas de los line items
    - **variants:** Campo **Array** que contiene las variantes de los line items
    - **taxes_included:** Campo **Boolean** que indica si los impuestos estan incluidos en el subtotal de la Orden **( true )** o no **( false )**
    - **tax_lines:** Campo **Array** que contiene Objetos con el detalle de cada impuesto:
        
        ```javascript
        price   : { type: Number,   default: null }
        rate    : { type: Number,   default: null }
        title   : { type: String,   default: null }
        ```
        **Descripcion:**

        - **price:** Campo **Number** que contiene el monto del impuesto
        - **rate:** Campo **Number** que contiene la tarifa del impuesto ( 5% = 0.05 )
        - **title:** Campo **String** que contiene el el nombre del Impuesto

    - **subtotal_price:** Campo **Number** que contiene el subtotal de la orden **restando los descuentos** y sin incluir **impuestos**, **costo de envios**, **aranceles** y **propinas**
    - **total_discounts:** Campo **Number** que contiene el acumulado de descuentos en la Orden
    - **total_line_items_price:** Campo **Number** que contiene el acumulado de precios de cada line item multiplicado por su cantidad
    - **total_outstanding:** Campo **Number** que contiene el total pendiente de pago por el cliente
    - **total_price:** Campo **Number** que contiene el valor total de cada producto menos sus descuentos, agregando impuestos, costo de envio y propinas
    - **total_shipping_price:** Campo **Number** que contiene el total del costo de envio de la orden ( si **taxes_include** es true, este campo incluye impuestos )
    - **total_tax:** Campo **Number** que contiene el total de impuestos aplicados a la Orden
    - **checkout_token:** Campo **String** que contiene un valor unico que hace referencia al chekcoutde la Orden en Shopify
    - **total_weight:** Campo **Number** que contiene el peso total de la orden
    - **billing_address:** Campo **Object** que contiene la direccion asociada al metodo de Pago
    - **shipping_address:** Campo **Object** que contiene la direccion de envio
    - **shipping_lines:** Campo **Array** que contiene Objetos con el detalle de cada metodo de envio:
        
        - ### Order - Shipping Lines
        ```javascript
        code                            : { type: String,   default: null }
        discounted_price                : { type: Number,   default: null }
        price                           : { type: Number,   default: null }
        source                          : { type: String,   default: null }
        title                           : { type: String,   default: null }
        tax_lines                       : { type: Object,   default: null } 
        carrier_identifier              : { type: Number,   default: null }
        requested_fulfillment_service_id: { type: Number,   default: null }
        ```
        **Descripcion:**

        - **code:** Campo **String** que contiene una referencia al metodo de envio
        - **discounted_price:** Campo **Number** que contiene el descuento aplicado al metodo de envio
        - **price:** Campo **Number** que contiene el precio del metodo de envio
        - **source:** Campo **String** que contiene la fuente del metodo de envio
        - **title:** Campo **String** que contiene el titulo del metodo de envio
        - **tax_lines:** Campo **Object** que contiene los Objetos con las informacion de cada Impuesto
        - **carrier_identifier:** Campo **Number** que contiene una referencia al servicio de transporte que propociona la tarifa
        - **requested_fulfillment_service_id:** Campo **Number** que contiene una referencia al cumplimiento del metodo de envio

    - **fulfillments:** Campo **Array** que contiene Objetos con informacion de cada envio cumplido, estos se componen de:
    
        - ### Order - Fulfillments
        ```javascript
        shopify_id          : { type: Number,   default: null }
        location_id         : { type: Number,   default: null }
        name                : { type: String,   default: null }
        service             : { type: String,   default: null }
        shipment_status     : { type: String,   default: null }
        fulfillment_status  : { type: String,   default: null } 
        tracking_company    : { type: String,   default: null } 
        tracking_number     : { type: Number,   default: null } 
        tracking_numbers    : { type: Obejct,   default: [] } 
        tracking_url        : { type: String,   default: null } 
        tracking_urls       : { type: Obejct,   default: [] } 
        line_items          : { type: Obejct,   default: [] }
        created_at          : { type: Date,     default: [] } 
        updated_at          : { type: Date,     default: [] } 
        ```
        **Descripcion:**

        - **shopify_id:** Campo **Number** que contiene el shopify id del fulfillment
        - **location_id::** Campo **Number** que contiene id de la ubicacion donde se proceso el fullfilment
        - **name::** Campo **String** que contiene el nombre del fulfillment conformado por el nombre de la orden y el numero de fulfillment separados por un punto ( . ) Ejemplo: PLN-1001.1
        - **service::** Campo **String** que contiene el servicio asociado al fulfillment
        - **shipment_status:** Campo **String** que contiene estado del envio del fulfillment
        - **fulfillment_status:** Campo **String** que contiene el estado del fulfillment
        - **tracking_company:** Campo **String** que contiene el nombre de la compañia de envios
        - **tracking_number:** Campo **Number** que contiene el numero de tracking del envio
        - **tracking_numbers:** Campo **Array** que contiene los numeros de tracking de envio
        - **tracking_url:** Campo **String** que contiene la url del estado del envio
        - **tracking_urls:** Campo **Array** que contiene las url del estado del envio
        - **line_items:** Campo **Array** que contiene los shopify id de cadaitem relacionado con el fulfillment
        - **created_at:** Campo **Date** que contiene la fecha de creacion del fulfillment
        - **updated_at:** Campo **Date** que contiene la fecha de actualizacion del fulfillment

    - **refunds:** Campo **Array** que contiene los Objectos de los reembolsos realizados en la orden, estos se componen de:
        
        - ### Order - Refunds
        ```javascript
        shopify_id          : { type: Number,   default: null }
        location_id         : { type: Number,   default: null }
        note                : { type: String,   default: null }
        restock             : { type: Boolean,   default: false }
        total_duties        : { type: Number,   default: 0 }
        order_adjustments   : { type: Object,   default: [] } 
        transactions        : { type: Object,   default: [] } 
        refund_line_items   : { type: Object,   default: [] } 
        ```
        **Descripcion:**

        - **shopify_id:** Campo **Number** que contiene el shopify id del refund
        - **location_id:** Campo **Number** que contiene el id de la ubicacion donde se proceso el refund
        - **note:** Campo **String** que contiene la nota agregada al refund
        - **restock:** Campo **Boolean** que indica si los items relacionados con el refund se suman al stock del producto **( true )** o no **( false )**
        - **total_duties:** Campo **Number** que contiene el total de impuestos en el refund
        - **order_adjustments:** Campo **Array** que contiene los ajustes hecho a la orden durante el refund, estos se componen de:
            
            ```javascript
            shopify_id         : { type: Number,   default: null }
            amount             : { type: Number,   default: 0 }
            tax_amount         : { type: Number,   default: 0 }
            kind               : { type: String,   default: null }
            reason             : { type: String,   default: null }
            ```
            **Descripcion:**

            - **shopify_id:** Campo **Number** que contiene el shopify id del ajuste en la orden
            - **amount:** Campo **Number** que contiene el valor de la diferencia en la orden
            - **tax_amount:** Campo **Number** que contiene total de los impuestos relacionados a **amount** y los impuestos realcionados con el envio
            - **kind:** Campo **String** que contiene el tipo de ajuste en la orden
            - **reason:** Campo **String** que contiene el motivo por el que se realiza el ajuste

        - **transactions:** Campo **Array** que contiene las transacciones realizadas en la orden, estas se componen de:
            
            ```javascript
            shopify_id          : { type: Number,   default: null }
            amount              : { type: Number,   default: 0 }
            autorization        : { type: Number,   default: 0 }
            device_id           : { type: String,   default: null }
            error_code          : { type: String,   default: null }
            gateway             : { type: Number,   default: 0 }
            kind                : { type: String,   default: null }
            localtion_id        : { type: Number,   default: null }
            message             : { type: Number,   default: 0 }
            source_name         : { type: Number,   default: 0 }
            transaction_status  : { type: String,   default: null }
            created_at          : { type: String,   default: null }
            processed_at        : { type: String,   default: null }
            ```
            **Descripcion:**

            - **shopify_id:** Campo **Number** que contiene el shopify id de la transaccion
            - **amount:** Campo **Number** que contiene el monto de la transaccion
            - **autorization:** Campo **Number** que contiene el codigo de autorizacion asociado a la transaccion
            - **device_id:** Campo **Number** que contiene el id del dispositivo donde se realizo la transaccion
            - **error_code:** Campo **String** que contiene el codigo de error estandarizado independientemente del proveedor de pago
            - **gateway:** Campo **String** que contiene el nombre de la puerta de enlace a travez de la cual se realizo la transaccion
            - **kind:** Campo **String** que contiene el tipo de transaccion
            - **localtion_id:** Campo **Number** que contiene el id de la ubicacion fisica donde se realizo la transaccion
            - **message:** Campo **String** que contiene el mensaje generado por el proveedor de pago ya sea si la transaccion se realizo o fallo
            - **source_name:** Campo **String** que contiene el origen de la transaccion
            - **transaction_status:** Campo **String** que contiene el estado de la transaccion
            - **created_at:** Campo **Date** que contiene la fecha de creaccion de la transaccion
            - **processed_at:** Campo **Date** que contiene la fecha de procesado de la transaccion

        - **refund_line_items:** Campo **Array** que contiene los line items que se reembolsaron, estos se componen de:
    
            ```javascript
            shopify_id          : { type: Number,   default: null }
            localtion_id        : { type: Number,   default: null }
            line_item_id        : { type: Number,   default: null }
            quantity            : { type: Number,   default: 0 }
            restock_type        : { type: String,   default: null }
            subtotal            : { type: Number,   default: 0 }
            total_tax           : { type: Number,   default: 0 }
            ```
            **Descripcion:**

            - **shopify_id:** Campo **Number** que contiene el shopify id del item reembolsado
            - **localtion_id:** Campo **Number** que contiene el id de la ubicacion donde se reabastecera el articulo
            - **line_item_id:** Campo **Number** que contiene el shopify id del articulo a reembolsar
            - **quantity:** Campo **Number** que contiene la cantidad de items a reembolsar
            - **restock_type:** Campo **String** que contiene la forma en que el reembolso de un articulo afecta el inventario
            - **subtotal:** Campo **Number** que contiene el subtotal del monto a reembolsar
            - **total_tax:** Campo **Number** que contiene el total de impuestos a reemboplsar

    - **cancel_reason:** Campo **String** que contiene la razon por la cual se cancelo la Orden
    - **note:** Campo **String** que contiene las notas que tiene la Orden
    - **note_attributes:** Campo **Object** que contiene campos adicionales en la Orden
    - **financial_status:** Campo **String** que contiene el estado del pago de la Orden
    - **fulfillment_status:** Campo **String** que contiene el estado de los envios de la Orden
    - **order_status_url:** Campo **String** que contiene la url para conocer el estado actual de lpedido
    
    **Notas:**

    - los Campos **billing_address** y **shipping_address** comparten la misma estructura, esta es:
        
        - ### Order - Billing Address y Shipping Address
        ```javascript
        first_name      : { type: String,   default: null }
        last_name       : { type: String,   default: null }
        phone           : { type: String,   default: null }
        company         : { type: String,   default: null }
        address_1       : { type: String,   default: null }
        address_2       : { type: String,   default: null }
        country_name    : { type: String,   default: null }
        country_code    : { type: String,   default: null }
        state           : { type: String,   default: null }
        state_code      : { type: String,   default: null }
        city            : { type: String,   default: null }
        zip             : { type: String,   default: null }
        latitude        : { type: String,   default: null }
        longitude       : { type: String,   default: null }
        ```
        **Descripcion:**

        - **first_name:** Campo **String** que contiene el o los nombres de la persona que recibe la Orden
        - **last_name:** Campo **String** que contiene el o los apellidos de la persona que recibe la Orden
        - **phone:** Campo **String** que contiene el numero de telefono de la persona que recibe la Orden
        - **company:** Campo **String** que contiene la compañia que recibe la Orden
        - **address_1:** Campo **String** que contiene la parte principal de la direccion
        - **address_2:** Campo **String** que contiene la parte complementaria de la direccion
        - **country_name:** Campo **String** que contiene el nombre del Pais a donde se envia la Orden
        - **country_code:** Campo **String** que contien el Codigo ISO 3166-2 del Pais
        - **state:** Campo **String** que contiene el Nonbre del Estado a donde se envia la Orden **( en Shopify es llamado province )**
        - **state_code:** Campo **String** que contien el Codigo ISO 3166-2 del Estado **( en Shopify es llamado province_code )**
        - **city:** Campo **String** que contiene el nombre de la ciudad a donde se envia la Orden
        - **zip:** Campo **String** que contien el Zip-code donde se enviara la Orden
        - **latitude:** Campo **String** que contien la coordenada geografica de latitud donde se encuentra la direccion proporcionada ( lo genera shopify )
        - **longitude:** Campo **String** que contien que contien la coordenada geografica de longitud donde se encuentra la direccion proporcionada ( lo genera shopify )

- ## Order Line Item [(link file)](https://gitlab.com/2becommercedevelopers/hefesto-back-services/-/tree/dev-pedro/stores-module/order-line-item.model.js "/stores-module/order-line-item.model.js")

    ```javascript
    shopify_id          : { type: Number,   default: null }
    order_id            : { type: Number,   default: null }
    customer_id         : { type: Number,   default: null }
    product_id          : { type: Number,   default: null }
    variant_id          : { type: Number,   default: null }
    name                : { type: String,   default: null }
    variant_title       : { type: String,   default: null }
    title               : { type: String,   default: null }
    sku                 : { type: String,   default: null }
    brand               : { type: String,   default: null }
    quantity            : { type: Number,   default: 0 }
    price               : { type: Number,   default: 0 }
    currency_code       : { type: String,   default: null }
    total_discount      : { type: Number,   default: 0 }
    tax_lines           : { type: Object,   default: [] }
    taxable             : { type: Boolean,  default: false }
    grams               : { type: Number,   default: 0 }
    requires_shipping   : { type: Boolean,  default: true }
    fulfillable_quantity: { type: Number,   default: 0 }
    fulfillment_service : { type: String,   default: null }
    fulfillment_status  : { type: String,   default: null }
    ```
    **Descripcion:**

    - **shopify_id          :** Campo **Number** que contiene el shopify id del line item
    - **order_id            :** Campo **Number** que contiene el shopify id de la Orden que contiene el line item
    - **customer_id         :** Campo **Number** que contiene el shopify id del cliente que genero la Orden
    - **product_id          :** Campo **Number** que contiene el shopify id del producto que contiene la variante agregada a la Orden
    - **variant_id          :** Campo **Number** que contiene el shopify id de la Variante del Producto
    - **name                :** Campo **String** que contiene el titulo del producto y el titulo de la variante separados por un guion ( - )
    - **variant_title       :** Campo **String** que contiene el titulo de la variante del producto conformado por sus caracteristicas cada una dividida por un slash ( / )
    - **title               :** Campo **String** que contiene el titulo del prodcuto
    - **sku                 :** Campo **String** que contiene el Stock Keeping Unit unico para cada variante de un Producto
    - **brand               :** Campo **String** que contiene la Marca del Producto
    - **quantity            :** Campo **Number** que contiene la cantidad agregada a la orden
    - **price               :** Campo **Number** que contiene el precio del line item
    - **currency_code       :** Campo **String** que contiene el codigo de la Moneda, Ejemplo: USD
    - **total_discount      :** Campo **Number** que contiene el total de descuentos aplicados a este line item
    - **tax_lines           :** Campo **Array** que contiene Objetos con el detalle de cada impuesto:
        
        ```javascript
        price   : { type: Number,   default: null }
        rate    : { type: Number,   default: null }
        title   : { type: String,   default: null }
        ```
        **Descripcion:**

        - **price:** Campo **Number** que contiene el monto del impuesto
        - **rate:** Campo **Number** que contiene la tarifa del impuesto ( 5% = 0.05 )
        - **title:** Campo **String** que contiene el el nombre del Impuesto

    - **taxable             :** Campo **Boolean** que indica si el line item incluye los impuestos en el precio **( true )** o no **( false )**
    - **grams               :** Campo **Number** que contiene el peso en gramos del line item
    - **requires_shipping   :** Campo **Boolean** que indica si el line item necesita ser enviado **( true )** o no **( false )**
    - **fulfillable_quantity:** Campo **Number** que contiene la cantidad de enviada del line item
    - **fulfillment_service :** Campo **String** que contiene el proveedor de servicio que esta realizando el envio
    - **fulfillment_status  :** Campo **String** que contiene el estado en el que se encuentra el envio del line item
    
# Products Module [(link folder)](https://gitlab.com/2becommercedevelopers/hefesto-back-services/-/tree/dev-pedro/products-module "/products-module")

- ## Product [(link file)](https://gitlab.com/2becommercedevelopers/hefesto-back-services/-/tree/dev-pedro/products-module/product.model.js "/products-module/product.model.js")

    ```javascript
    shopify_id      : { type: Number,   default: null }
    title           : { type: String,   default: null }
    description     : { type: String,   default: null }
    handle          : { type: String,   default: null }
    tags            : { type: Object,   default: [] }
    images          : { type: Object,   default: [] }
    brand           : { type: String,   default: null }
    product_type    : { type: String,   default: null }
    options         : { type: Object,   default: [] }
    variants        : [{ type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_product_variant', autopopulate: true }]
    skus            : { type: Object,   default: [] } 
    total_stock     : { type: Number,   default: 0 }
    sku_parent      : { type: Object,   default: null }
    published_at    : { type: Date,     default: null }
    ```
    
    **Descripcion:**

    - **shopify_id      :** Campo **Number** que contiene el shopify id del Producto
    - **title           :** Campo **String** que contiene el titulo del Producto
    - **description     :** Campo **String** que contiene la description del producto ( Comunmente es un HTML )
    - **handle          :** Campo **String** que contiene el handle del producto generado a partir del Titulo
    - **tags            :** Campo **Array** que contiene los tags del Producto
    - **images          :** Campo **Array** que contiene Objetos con las imagenes del Producto, estas se componen de:
        
        ```javascript
        shopify_id  : { type: Number,   default: null }
        alt         : { type: String,   default: null }
        src         : { type: String,   default: null }
        width       : { type: Number,   default: 0 }
        height      : { type: Number,   default: 0 }
        ```

        **Descripcion:**

        - **shopify_id:** Campo **Number** que contiene el shopify id de la Imagen 
        - **alt:** Campo **String** que contiene el titulo del Producto 
        - **src:** Campo **String** que contiene la url de la imagen 
        - **width:** Campo **Number** que contiene el ancho de la imagen
        - **height:** Campo **Number** que contiene el alto de la imagen

    - **brand           :** Campo **String** que contiene la marca del Producto
    - **product_type    :** Campo **String** que contiene el tipo de Producto
    - **options         :** Campo **Array** que contiene los grupos de variantes que posee el producto, estos se componene de:

        ```javascript
        name    : { type: String,   default: null }
        values  : { type: Object,   default: [] }
        ```

        **Descripcion:**

        - **name:** Campo **String** que contiene el nombre del grupo de variantes. Ejemplo: "Size" 
        - **values:** Campo **Array** que contiene un listado con las variantes de este grupo

    - **variants        :** Campo **Array ObjectId** que contiene referencias a las variantes del producto en el modelo **back_product_variants**
    - **skus            :** Campo **Array** que contiene los Skus de cada variante del producto
    - **total_stock     :** Campo **Number** que contiene total de stock del Producto
    - **sku_parent      :** Campo **Object** que contiene el SKU Parent del Producto, formado por un acronimo de la Marca y numero de Referencia
    - **published_at    :** Campo **Date** que contiene la fecha en la cual se publico el producto

- ## Product Variant [(link file)](https://gitlab.com/2becommercedevelopers/hefesto-back-services/-/tree/dev-pedro/products-module/product.model.js "/products-module/product-variant.model.js")

    ```javascript
    shopify_id          : { type: Number,   default: null }
    product_id          : { type: Number,   default: null }
    sku                 : { type: String,   default: null }
    sku_parent          : { type: Object,   default: null }
    title               : { type: String,   default: null }
    title_product       : { type: String,   default: null }
    brand               : { type: String,   default: null }
    product_type        : { type: String,   default: null }
    price               : { type: Number,   default: 0 }
    compare_at_price    : { type: Number,   default: null }
    options             : { type: Object,   default: [] }
    image               : { type: Object,   default: null }
    barcode             : { type: String,   default: null }
    grams               : { type: Number,   default: 0 }
    weight              : { type: Number,   default: 0 }
    weight_unit         : { type: String,   default: null }
    inventory_policy    : { type: String,   default: null }
    inventory_item_id   : { type: Number,   default: null }
    requires_shipping   : { type: Boolean,  default: true }
    inventory_quantity  : { type: Number,   default: 0 }
    fulfillment_service : { type: String,   default: null }
    inventory_management: { type: String,   default: null }
    ```
    
    **Descripcion:**

    - **shopify_id          :** Campo **Number** que contiene el shopify id de la variante
    - **product_id          :** Campo **Number** que contiene el shopify id del producto que contiene la variante
    - **sku                 :** Campo **String** que contiene el SKU (Stock Keeping Unit) de la variante
    - **sku_parent          :** Campo **Object** que contiene el SKU Parent del Producto, formado por un acronimo de la Marca y numero de Referencia
    - **title               :** Campo **String** que contiene el titulo de la variante
    - **title_product       :** Campo **String** que contiene el titul ode lProducto
    - **brand               :** Campo **String** que contiene la Marca del Producto
    - **product_type        :** Campo **String** que contiene el Tipo de Producto
    - **price               :** Campo **Number** que contiene el precio de la variante
    - **compare_at_price    :** Campo **Number** que contiene el precio de comparacion de la variante
    - **options             :** Campo **Array** que contiene las opciones que conforman la variante, Ejemplo: XL, Black
    - **image               :** Campo **Object** que contiene el Objeto con la Imagen de la variante
    - **barcode             :** Campo **String** que contiene el codigo de Barras de la variante
    - **grams               :** Campo **Number** que contiene el peso de la variante en gramos
    - **weight              :** Campo **Number** que contiene el peso de la variante expresado en el sistem de unidades especificado en **weight_unit**
    - **weight_unit         :** Campo **String** que contiene el sistema de unidades a usar para mostrar el peso
    - **inventory_policy    :** Campo **String** que contiene la politica de inventario que se aplica a esta variante, si permite hacer pedidos si la variante esta agotada o no
    - **inventory_item_id   :** Campo **Number** que contiene el id del elemento de inventario
    - **requires_shipping   :** Campo **Boolean** que indica si la variante requiere ser enviada **( true )** o no **( false )**
    - **inventory_quantity  :** Campo **Number** que contiene la cantiadad de unidades disponibles para esta variante
    - **fulfillment_service :** Campo **String** que contiene el servicio que se encargara de enviar la variante
    - **inventory_management:** Campo **String** que contiene el servicio que realiza seguimiento del numero de articulos en stock para la variante

