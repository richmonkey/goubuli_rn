//
//  SVProgressHUDModule.m
//  app
//
//  Created by houxh on 2017/3/13.
//  Copyright © 2017年 Facebook. All rights reserved.
//

#import "SVProgressHUDModule.h"
#import "SVProgressHUD.h"

@implementation SVProgressHUDModule
RCT_EXPORT_MODULE();

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(show:(NSString*)status)
{
  [SVProgressHUD setDefaultMaskType:SVProgressHUDMaskTypeBlack];
  if (status.length == 0) {
    status = nil;
  }
  [SVProgressHUD showWithStatus:status];
}

RCT_EXPORT_METHOD(dismiss)
{
  [SVProgressHUD dismiss];
}
@end
