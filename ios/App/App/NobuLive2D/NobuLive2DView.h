#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface NobuLive2DView : UIView

- (instancetype)initWithCharacter:(NSString *)character NS_DESIGNATED_INITIALIZER;
- (instancetype)initWithFrame:(CGRect)frame NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)coder NS_UNAVAILABLE;

- (void)setCharacter:(NSString *)character;
- (void)playExpression:(NSString *)expressionName;
- (void)playMotionGroup:(NSString *)group index:(NSInteger)index;

@end

NS_ASSUME_NONNULL_END
