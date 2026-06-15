<?php

namespace App\Filament\Resources;

use App\Filament\Resources\MenuItemResource\Pages;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables\Actions\DeleteAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class MenuItemResource extends Resource
{
    protected static ?string $model = MenuItem::class;

    protected static ?string $navigationIcon = 'heroicon-o-shopping-bag';

    protected static ?string $navigationLabel = 'Ítems del menú';

    protected static ?string $modelLabel = 'Ítem';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Select::make('menu_category_id')
                ->label('Categoría')
                ->options(MenuCategory::where('is_active', true)->orderBy('sort_order')->pluck('name', 'id'))
                ->required()
                ->searchable(),

            TextInput::make('name')
                ->label('Nombre')
                ->required()
                ->maxLength(255),

            Textarea::make('description')
                ->label('Descripción')
                ->nullable()
                ->rows(3),

            TextInput::make('price')
                ->label('Precio')
                ->required()
                ->numeric()
                ->prefix('$')
                ->minValue(0),

            FileUpload::make('image')
                ->label('Imagen')
                ->image()
                ->directory('menu-items')
                ->imageEditor()
                ->nullable(),

            TextInput::make('sort_order')
                ->label('Orden')
                ->numeric()
                ->default(0),

            Toggle::make('is_available')
                ->label('Disponible')
                ->default(true),

            Toggle::make('is_featured')
                ->label('Destacado')
                ->default(false),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('image')->label('Foto'),
                TextColumn::make('name')->label('Nombre')->searchable(),
                TextColumn::make('category.name')->label('Categoría')->sortable(),
                TextColumn::make('price')->label('Precio')->money('cop')->sortable(),
                IconColumn::make('is_available')->label('Disponible')->boolean(),
                IconColumn::make('is_featured')->label('Destacado')->boolean(),
                TextColumn::make('sort_order')->label('Orden')->sortable(),
            ])
            ->defaultSort('menu_category_id')
            ->filters([
                SelectFilter::make('menu_category_id')
                    ->label('Categoría')
                    ->options(MenuCategory::pluck('name', 'id')),
                SelectFilter::make('is_available')
                    ->label('Disponibilidad')
                    ->options([1 => 'Disponible', 0 => 'No disponible']),
            ])
            ->actions([EditAction::make(), DeleteAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListMenuItems::route('/'),
            'create' => Pages\CreateMenuItem::route('/create'),
            'edit'   => Pages\EditMenuItem::route('/{record}/edit'),
        ];
    }
}
