import BaseContext from './baseContext';

declare class ControllerContext extends BaseContext {

    /**
     * @member {Service} service
     */
    service: Object;
}

export as namespace ControllerContext;
export = ControllerContext;
