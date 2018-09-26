import BaseContext from './baseContext';

declare class ServiceContext extends BaseContext {

    /**
     * @member {Service} service
     */
    service: Object;
}

export as namespace ServiceContext;
export = ServiceContext;
