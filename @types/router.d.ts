import BaseContext from './baseContext';

declare class RouterContext extends BaseContext {

    /**
     * @member {Controller} controller
     */
    controller: Object;

    /**
     * @member {Middleware} middleware
     */
    middleware: Object;
}

export as namespace RouterContext;
export = RouterContext;
